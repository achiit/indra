import { client, USE_MOCK } from './client'
import type { Alert } from '@/types/indra'
import { MOCK_ALERTS } from './mockData'

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export async function fetchAlerts(): Promise<Alert[]> {
  if (USE_MOCK) { await delay(500); return MOCK_ALERTS }
  const res = await client.get<{alerts: Alert[], count: number}>('/api/domain-alerts')
  return res.data.alerts || []
}

export async function markAlertRead(id: string): Promise<void> {
  if (USE_MOCK) { await delay(100); return }
  await client.patch(`/api/alerts/${id}/read`)
}

export async function markAllRead(): Promise<void> {
  if (USE_MOCK) { await delay(100); return }
  await client.post('/api/alerts/read-all')
}
