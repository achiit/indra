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
      className={cn('d-inline-flex align-items-center rounded-2 fw-medium px-2 py-1 border', className)}
      style={{ color, borderColor: `${color}40`, background: `${color}15`, fontSize: '0.625rem' }}
    >
      {EDGE_LABELS[type]}
    </span>
  )
}
