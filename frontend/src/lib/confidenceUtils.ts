import type { EdgeType } from '@/types/indra'

export type ConfidenceTier = 'high' | 'medium' | 'low' | 'stale'

export function getConfidenceTier(c: number): ConfidenceTier {
  if (c > 0.7)  return 'high'
  if (c > 0.4)  return 'medium'
  if (c > 0.15) return 'low'
  return 'stale'
}

export const CONFIDENCE_COLORS: Record<ConfidenceTier, string> = {
  high:   '#10B981',  // emerald-400
  medium: '#F59E0B',  // amber-400
  low:    '#F97316',  // orange-400
  stale:  '#6B7280',  // zinc-500
}

export const CONFIDENCE_TEXT: Record<ConfidenceTier, string> = {
  high:   'text-emerald-400',
  medium: 'text-amber-400',
  low:    'text-orange-400',
  stale:  'text-zinc-500',
}

export const CONFIDENCE_BG: Record<ConfidenceTier, string> = {
  high:   'bg-emerald-400/10',
  medium: 'bg-amber-400/10',
  low:    'bg-orange-400/10',
  stale:  'bg-zinc-700/30',
}

export function getConfidenceColor(c: number): string {
  return CONFIDENCE_COLORS[getConfidenceTier(c)]
}

export function getConfidenceTextClass(c: number): string {
  return CONFIDENCE_TEXT[getConfidenceTier(c)]
}

// Domain accent colors
export const DOMAIN_COLORS: Record<string, string> = {
  geopolitics: '#7C3AED',
  economics:   '#0EA5E9',
  defense:     '#EF4444',
  technology:  '#A855F7',
  climate:     '#10B981',
  society:     '#F59E0B',
  general:     '#6B7280',
}

// Entity type colors
export const ENTITY_COLORS: Record<string, string> = {
  NATION:             '#10B981',
  LEADER:             '#0EA5E9',
  ORGANIZATION:       '#A855F7',
  MILITARY_UNIT:      '#EF4444',
  TREATY:             '#22C55E',
  ECONOMIC_INDICATOR: '#F59E0B',
  CONFLICT_ZONE:      '#F97316',
  POLICY:             '#06B6D4',
  TECHNOLOGY:         '#8B5CF6',
  NATURAL_RESOURCE:   '#84CC16',
  ALLIANCE:           '#14B8A6',
  SANCTION:           '#FB7185',
  UNKNOWN:            '#6B7280',
}

// Edge type labels
export const EDGE_LABELS: Record<EdgeType, string> = {
  CAUSES:       'Causes',
  BLOCKS:       'Blocks',
  FUNDS:        'Funds',
  CONTROLS:     'Controls',
  THREATENS:    'Threatens',
  SUPPORTS:     'Supports',
  TRADES_WITH:  'Trades With',
  SANCTIONS:    'Sanctions',
  ALLIES_WITH:  'Allies With',
  COMPETES_WITH:'Competes With',
  RELATED_TO:   'Related To',
}

export const EDGE_COLORS: Partial<Record<EdgeType, string>> = {
  THREATENS:   '#EF4444',
  CAUSES:      '#F97316',
  SANCTIONS:   '#FB7185',
  ALLIES_WITH: '#10B981',
  SUPPORTS:    '#10B981',
  TRADES_WITH: '#0EA5E9',
  CONTROLS:    '#A855F7',
  COMPETES_WITH:'#F59E0B',
  BLOCKS:      '#EF4444',
  FUNDS:       '#22C55E',
  RELATED_TO:  '#6B7280',
}
