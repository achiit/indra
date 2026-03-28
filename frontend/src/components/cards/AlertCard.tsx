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
        'flex gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
        alert.read ? 'border-[#2A2A3A] bg-[#111118]' : 'border-[#7C3AED]/30 bg-[#111118]',
        'hover:border-[#2A2A3A] hover:bg-[#16161F]'
      )}
      onClick={onClick}
    >
      {/* unread indicator */}
      {!alert.read && <div className="mt-1.5 w-1 flex-shrink-0 self-stretch rounded-full bg-purple-500" />}

      {/* confidence before → after */}
      <div className="flex flex-col items-center gap-1 min-w-[52px]">
        <span className="text-xs font-mono text-zinc-400">{alert.confidence_before.toFixed(2)}</span>
        <ArrowRight size={10} className="text-red-400" />
        <span className="text-xs font-mono text-red-400 font-semibold">{alert.confidence_after.toFixed(2)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#F4F4F5] truncate">{alert.entity_label}</span>
          <EdgeTypeBadge type={alert.edge_type} />
          {isCritical && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20"
            >
              CRITICAL
            </motion.span>
          )}
        </div>
        {!compact && <p className="text-xs text-zinc-400 mt-1 truncate">{alert.message}</p>}
        <div className="flex items-center gap-3 mt-2">
          <ConfidenceDot value={alert.confidence_after} showLabel />
          <span className="text-[11px] text-zinc-500">{formatRelativeTime(alert.created_at)}</span>
          <span className="text-[11px] font-semibold text-red-400">−{Math.round(dropPct)}%</span>
        </div>
      </div>

      {!compact && (
        <button
          className="text-xs text-purple-400 hover:text-purple-300 flex-shrink-0 self-center font-medium"
          onClick={(e) => { e.stopPropagation(); nav(`/blast-radius?entity=${alert.entity_id}`) }}
        >
          Investigate →
        </button>
      )}
    </motion.div>
  )
}
