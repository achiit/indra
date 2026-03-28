import type { EntityType } from '@/types/indra'
import { ENTITY_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ENTITY_LABELS: Record<EntityType, string> = {
  NATION:             'Nation',
  LEADER:             'Leader',
  ORGANIZATION:       'Org',
  MILITARY_UNIT:      'Military',
  TREATY:             'Treaty',
  ECONOMIC_INDICATOR: 'Economic',
  CONFLICT_ZONE:      'Conflict Zone',
  POLICY:             'Policy',
  TECHNOLOGY:         'Tech',
  NATURAL_RESOURCE:   'Resource',
  ALLIANCE:           'Alliance',
  SANCTION:           'Sanction',
  UNKNOWN:            'Unknown',
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
        'inline-flex items-center rounded-md font-medium border',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        className
      )}
      style={{
        color,
        borderColor: `${color}40`,
        background: `${color}15`,
      }}
    >
      {ENTITY_LABELS[type]}
    </span>
  )
}
