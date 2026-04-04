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
  const tier = getConfidenceTier(value)
  const color = getConfidenceColor(value)
  const textCls = getConfidenceTextClass(value)
  return (
    <div className={cn('d-flex flex-column gap-1', className)}>
      {(label || showValue) && (
        <div className="d-flex justify-content-between align-items-center">
          {label && <span className="text-muted" style={{ fontSize: '0.75rem' }}>{label}</span>}
          {showValue && (
            <span className={cn('font-monospace fw-medium tabular-nums', textCls)} style={{ fontSize: '0.75rem' }}>
              {value.toFixed(2)}
            </span>
          )}
        </div>
      )}
      <div
        className="w-100 rounded-pill overflow-hidden bg-dark"
        style={{ height }}
      >
        <motion.div
          className="h-100 rounded-pill"
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ background: color, boxShadow: tier === 'high' ? `0 0 6px ${color}60` : undefined }}
        />
      </div>
    </div>
  )
}
