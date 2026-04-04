import { cn, getConfidenceColor, getConfidenceTier } from '@/lib/utils'

// re-export from correct location
export { getConfidenceColor }

interface ConfidenceDotProps {
  value: number
  className?: string
  showLabel?: boolean
}

export function ConfidenceDot({ value, className, showLabel }: ConfidenceDotProps) {
  const tier = getConfidenceTier(value)
  const color = getConfidenceColor(value)
  const labels: Record<string, string> = { high: 'Active', medium: 'Moderate', low: 'Weak', stale: 'Stale' }
  return (
    <span className={cn('d-inline-flex align-items-center gap-2', className)}>
      <span
        className={cn('rounded-circle flex-shrink-0', tier === 'high' ? 'animate-pulse' : '')}
        style={{ width: 7, height: 7, background: color, boxShadow: `0 0 4px ${color}` }}
      />
      {showLabel && <span className="text-muted" style={{ fontSize: '0.75rem' }}>{labels[tier]}</span>}
    </span>
  )
}

// re-export confidence utils for convenience in shared components
export { getConfidenceTier } from '@/lib/utils'
