import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { formatRelativeTime } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: ReactNode
  delta?: string
  deltaPositive?: boolean
  icon?: ReactNode
  sub?: string
  index?: number
  glowColor?: string
  /** ISO timestamp — shown as “Last verified: … ago” for gov-style provenance */
  lastVerified?: string | null
}

export function StatCard({ title, value, delta, deltaPositive, icon, sub, index = 0, glowColor, lastVerified }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<ReactNode>(0)

  useEffect(() => {
    if (typeof value !== 'string' && typeof value !== 'number') {
      setDisplayValue(value)
      return
    }
    const num = typeof value === 'number' ? value : parseFloat((value as string).replace(/,/g, ''))
    if (isNaN(num)) {
      setDisplayValue(value)
      return
    }

    let startTime: number
    const duration = 1500
    const isInteger = Number.isInteger(num)

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const current = progress * num
      setDisplayValue(isInteger ? Math.floor(current).toLocaleString() : current.toFixed(2))
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplayValue(value)
      }
    }
    requestAnimationFrame(step)
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
      className="position-relative rounded-3 border border-secondary bg-dark p-4 overflow-hidden w-100 h-100 d-flex flex-column"
      style={glowColor ? { boxShadow: `0 0 30px -10px ${glowColor}` } : { backgroundColor: '#111118' }}
    >
      {/* subtle top accent line */}
      {glowColor && (
        <div className="position-absolute top-0 start-0 end-0 rounded-top-3" style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${glowColor}60, transparent)` }} />
      )}
      <div className="d-flex justify-content-between align-items-start mb-3">
        <span className="fw-medium text-muted text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>{title}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className="d-flex align-items-end gap-3 flex-grow-1">
        <span className="h3 mb-0 fw-semibold text-light font-monospace tabular-nums tracking-tight">{displayValue}</span>
        {delta && (
          <span className={cn('fw-medium mb-1', deltaPositive ? 'text-success' : 'text-danger')} style={{ fontSize: '0.75rem' }}>
            {deltaPositive ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      {sub && <p className="mt-2 text-muted mb-0" style={{ fontSize: '0.75rem' }}>{sub}</p>}
      {lastVerified && (
        <div className="mt-2 d-flex align-items-center text-muted font-monospace text-uppercase tracking-wide mb-0" style={{ fontSize: '0.625rem' }}>
          Last verified: {formatRelativeTime(lastVerified)}
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="d-inline-block ms-2 rounded-circle bg-success shadow-sm"
            style={{ width: '6px', height: '6px', boxShadow: '0 0 8px #198754' }}
          />
        </div>
      )}
    </motion.div>
  )
}
