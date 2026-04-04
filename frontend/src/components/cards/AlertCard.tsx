import { motion } from 'framer-motion'
import type { Alert } from '@/types/indra'
import { ConfidenceDot } from '@/components/shared/ConfidenceDot'
import { EdgeTypeBadge } from '@/components/shared/EdgeTypeBadge'
import { formatRelativeTime, cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface AlertCardProps {
  alert: Alert
  compact?: boolean
  onClick?: () => void
}

export function AlertCard({ alert, compact, onClick }: AlertCardProps) {
  const nav = useNavigate()
  const dropPct = alert.drop_pct ?? Math.round(alert.delta * 100)
  const isCritical = dropPct > 50

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'd-flex gap-2 rounded-3 border p-3 cursor-pointer transition-colors w-100',
        alert.read ? 'border-secondary bg-dark opacity-75' : 'border-primary bg-dark shadow-sm'
      )}
      onClick={onClick}
    >
      {/* unread indicator */}
      {!alert.read && <div className="mt-1 w-1 flex-shrink-0 align-self-stretch rounded-pill bg-primary" style={{ width: '4px' }} />}

      {/* confidence before → after */}
      <div className="d-flex flex-column align-items-center gap-1" style={{ minWidth: '52px' }}>
        <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>{alert.confidence_before.toFixed(2)}</span>
        <ArrowRight size={10} className="text-danger" />
        <span className="text-danger font-monospace fw-semibold" style={{ fontSize: '0.75rem' }}>{alert.confidence_after.toFixed(2)}</span>
      </div>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="body-2 fw-semibold text-light text-truncate">{alert.entity_label}</span>
          <EdgeTypeBadge type={alert.edge_type} />
          {isCritical && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="fw-bold text-danger px-2 py-1 rounded-2 border border-danger bg-danger bg-opacity-10" style={{ fontSize: '0.625rem' }}
            >
              CRITICAL
            </motion.span>
          )}
        </div>
        {!compact && <p className="body-3 text-muted mt-1 text-truncate">{alert.message}</p>}
        <div className="d-flex align-items-center gap-3 mt-2 flex-wrap">
          <ConfidenceDot value={alert.confidence_after} showLabel />
          <span className="text-muted font-monospace text-uppercase tracking-wide" style={{ fontSize: '0.625rem' }}>
            Last verified: {formatRelativeTime(alert.created_at)}
          </span>
          <span className="fw-semibold text-danger" style={{ fontSize: '0.6875rem' }}>−{Math.round(dropPct)}%</span>
        </div>
      </div>

      {!compact && (
        <button
          className="btn btn-link text-primary text-decoration-none p-0 flex-shrink-0 align-self-center fw-medium"
          style={{ fontSize: '0.75rem' }}
          onClick={(e) => {
            e.stopPropagation()
            nav(`/blast-radius?query=${encodeURIComponent(alert.entity_id)}`)
          }}
        >
          Investigate →
        </button>
      )}
    </motion.div>
  )
}
