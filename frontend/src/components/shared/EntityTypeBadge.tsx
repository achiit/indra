import type { EntityType } from '@/types/indra'
import { ENTITY_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ENTITY_LABELS: Record<EntityType, string> = {
  NATION: 'Nation',
  LEADER: 'Leader',
  ORGANIZATION: 'Org',
  MILITARY_UNIT: 'Military',
  TREATY: 'Treaty',
  ECONOMIC_INDICATOR: 'Economic',
  CONFLICT_ZONE: 'Conflict Zone',
  POLICY: 'Policy',
  TECHNOLOGY: 'Tech',
  NATURAL_RESOURCE: 'Resource',
  ALLIANCE: 'Alliance',
  SANCTION: 'Sanction',
  UNKNOWN: 'Unknown',
}

interface EntityTypeBadgeProps {
  type: EntityType
  className?: string
  size?: 'sm' | 'md'
}

export function EntityTypeBadge({ type, className, size = 'sm' }: EntityTypeBadgeProps) {
  const color = ENTITY_COLORS[type] || '#6B7280'
  return (
    <span
      className={cn(
        'd-inline-flex align-items-center rounded-2 fw-medium border',
        size === 'sm' ? 'px-2 py-1' : 'px-3 py-1',
        className
      )}
      style={{
        color,
        borderColor: `${color}40`,
        background: `${color}15`,
        fontSize: size === 'sm' ? '0.625rem' : '0.75rem'
      }}
    >
      {ENTITY_LABELS[type]}
    </span>
  )
}
