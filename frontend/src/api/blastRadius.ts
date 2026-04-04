import { client, USE_MOCK } from './client'
import type { BlastRadiusResult } from '@/types/indra'
import { MOCK_BLAST_RESULT } from './mockData'

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export async function runBlastRadius(entity: string): Promise<BlastRadiusResult> {
  if (USE_MOCK) {
    await delay(2000)
    return { ...MOCK_BLAST_RESULT, entity: entity.toUpperCase(), entity_found: entity.toUpperCase() }
  }
  const res = await client.post<BlastRadiusResult>('/api/blast-radius', { entity })
  return res.data
}

export async function runBlastRadiusFast(entity: string): Promise<BlastRadiusResult> {
  if (USE_MOCK) return runBlastRadius(entity)
  const res = await client.post<BlastRadiusResult>('/api/blast-radius-fast', { entity })
  return res.data
}

export async function runQuery(query: string, mode: string): Promise<{ answer: string; question: string }> {
  if (USE_MOCK) {
    await delay(1500)
    return {
      question: query,
      answer: `**Intelligence Summary** — Based on the INDRA knowledge graph analysis:\n\nThe query "${query}" maps to multiple causal chains across the geopolitical and economic domains. Current confidence scores indicate elevated activity in the South Asian corridor, with moderate spillover risk to global energy markets.\n\nKey relationships show a 73% confidence linkage between regional military posturing and economic indicator volatility. Recommend monitoring the Indo-Pacific domain for secondary effects over the next 72-hour window.`,
    }
  }
  const res = await client.post('/api/query', { query, mode })
  return res.data
}

export type MorningBriefResponse = { briefing: string; generated_at?: string }

export async function generateMorningBrief(domain: string): Promise<MorningBriefResponse> {
  if (USE_MOCK) {
    await delay(900)
    return {
      briefing: `    ╔══════════════════════════════════════════════════════╗
    ║   INDRA INTELLIGENCE BRIEF                           ║
    ║   Classification: RESTRICTED                         ║
    ║   Domain: ${domain.toUpperCase()}                    ║
    ╠══════════════════════════════════════════════════════╣
    ║ SITUATION SUMMARY                                    ║
    ║ - 3 high-confidence developments detected (demo)   ║
    ║ - Cross-domain edges stable vs 24h prior             ║
    ║ - Alert pipeline nominal                             ║
    ║                                                      ║
    ║ STRATEGIC OUTLOOK                                    ║
    ║ Monitor LAC + energy corridors; brief updates 12h.   ║
    ╚══════════════════════════════════════════════════════╝`,
      generated_at: new Date().toISOString(),
    }
  }
  const res = await client.post<MorningBriefResponse>('/api/briefing', { domain })
  return res.data
}
