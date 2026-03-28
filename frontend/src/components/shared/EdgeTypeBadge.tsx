import type { EdgeType } from '@/types/indra'
import { EDGE_LABELS, EDGE_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface EdgeTypeBadgeProps {
  type: EdgeType
  className?: string
}

export function EdgeTypeBadge({ type, className }: EdgeTypeBadgeProps) {
  const color = EDGE_COLORS[type] || '#6B7280'
  return (
    <span
      className={cn('inline-flex items-center rounded-md text-[10px] font-medium px-1.5 py-0.5 border', className)}
      style={{ color, borderColor: `${color}40`, background: `${color}15` }}
    >
      {EDGE_LABELS[type]}
    </span>
  )
}
