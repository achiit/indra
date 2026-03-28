import { client, USE_MOCK } from './client'
import type { GraphData, ConfidenceHistogram } from '@/types/indra'
import { MOCK_GRAPH, MOCK_CONFIDENCE_DATA } from './mockData'

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export async function fetchGraph(domain?: string): Promise<GraphData> {
  if (USE_MOCK) {
    await delay(600)
    if (!domain || domain === 'warroom') return MOCK_GRAPH
    const nodes = MOCK_GRAPH.nodes.filter(n => n.domain === domain)
    const ids   = new Set(nodes.map(n => n.id))
    const edges = MOCK_GRAPH.edges.filter(e => ids.has(e.source) && ids.has(e.target))
    return { nodes, edges, total_nodes: nodes.length, total_edges: edges.length }
  }
  const url = domain ? `/api/domain/${domain}` : '/api/graph-data'
  const res = await client.get<GraphData>(url)
  return res.data
}

export async function fetchConfidence(): Promise<ConfidenceHistogram> {
  if (USE_MOCK) { await delay(400); return MOCK_CONFIDENCE_DATA as ConfidenceHistogram }
  const res = await client.get<ConfidenceHistogram>('/api/graph-confidence')
  return res.data
}
