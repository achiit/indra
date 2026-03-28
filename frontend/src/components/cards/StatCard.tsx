import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: ReactNode
  delta?: string
  deltaPositive?: boolean
  icon?: ReactNode
  sub?: string
  index?: number
  glowColor?: string
}

export function StatCard({ title, value, delta, deltaPositive, icon, sub, index = 0, glowColor }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
      className="relative rounded-xl border border-[#2A2A3A] bg-[#111118] p-5 overflow-hidden"
      style={glowColor ? { boxShadow: `0 0 30px -10px ${glowColor}` } : undefined}
    >
      {/* subtle top accent line */}
      {glowColor && (
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl" style={{ background: `linear-gradient(90deg, transparent, ${glowColor}60, transparent)` }} />
      )}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-semibold text-[#F4F4F5] font-mono tabular-nums">{value}</span>
        {delta && (
          <span className={cn('text-xs font-medium mb-1', deltaPositive ? 'text-emerald-400' : 'text-red-400')}>
            {deltaPositive ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </motion.div>
  )
}
