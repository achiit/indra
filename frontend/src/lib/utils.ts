// src/lib/utils.ts extension — add confidence helpers here too
// (already defined in confidenceUtils.ts, re-exporting for tree-shaking)
export { getConfidenceTier, getConfidenceColor, getConfidenceTextClass, ENTITY_COLORS, DOMAIN_COLORS, EDGE_LABELS, EDGE_COLORS } from './confidenceUtils'

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}
