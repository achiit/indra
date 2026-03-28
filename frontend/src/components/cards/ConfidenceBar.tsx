import { motion } from 'framer-motion'
import { getConfidenceColor, getConfidenceTextClass, getConfidenceTier } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ConfidenceBarProps {
  value: number
  label?: string
  showValue?: boolean
  className?: string
  height?: number
}

export function ConfidenceBar({ value, label, showValue = true, className, height = 4 }: ConfidenceBarProps) {
  const tier  = getConfidenceTier(value)
  const color = getConfidenceColor(value)
  const textCls = getConfidenceTextClass(value)
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs text-zinc-400">{label}</span>}
          {showValue && (
            <span className={cn('text-xs font-mono tabular-nums font-medium', textCls)}>
              {value.toFixed(2)}
            </span>
          )}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden bg-[#1e1e2e]"
        style={{ height }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ background: color, boxShadow: tier === 'high' ? `0 0 6px ${color}60` : undefined }}
        />
      </div>
    </div>
  )
}
