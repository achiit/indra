import type {
  TypedEntity, TypedEdge, Alert, BlastRadiusResult,
  QueryHistoryItem, Report, WatchlistItem, User, GraphData
} from '@/types/indra'

export const MOCK_USER: User = {
  id: 'usr_01',
  email: 'analyst@indra.io',
  name: 'Arjun Mehta',
  plan: 'analyst',
  created_at: '2025-01-15T08:00:00Z',
  last_login: new Date().toISOString(),
}

export const MOCK_ENTITIES: TypedEntity[] = [
  { id: 'INDIA', label: 'India', type: 'NATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'PAKISTAN', label: 'Pakistan', type: 'NATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'CHINA', label: 'China', type: 'NATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'USA', label: 'United States', type: 'NATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'RUSSIA', label: 'Russia', type: 'NATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'IRAN', label: 'Iran', type: 'NATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'ISRAEL', label: 'Israel', type: 'NATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'UKRAINE', label: 'Ukraine', type: 'NATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'NATO', label: 'NATO', type: 'ALLIANCE', domain: 'defense', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'IMF', label: 'IMF', type: 'ORGANIZATION', domain: 'economics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'PM_MODI', label: 'PM Modi', type: 'LEADER', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'XI_JINPING', label: 'Xi Jinping', type: 'LEADER', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'BRICS', label: 'BRICS', type: 'ALLIANCE', domain: 'economics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'UN', label: 'United Nations', type: 'ORGANIZATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'SOUTH_CHINA_SEA', label: 'South China Sea', type: 'CONFLICT_ZONE', domain: 'defense', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'LAC', label: 'Line of Actual Control', type: 'CONFLICT_ZONE', domain: 'defense', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'AI_ACT', label: 'EU AI Act', type: 'POLICY', domain: 'technology', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'SEMICONDUCTOR', label: 'Semiconductors', type: 'TECHNOLOGY', domain: 'technology', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'CRUDE_OIL', label: 'Crude Oil', type: 'NATURAL_RESOURCE', domain: 'economics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'QUAD', label: 'QUAD Alliance', type: 'ALLIANCE', domain: 'defense', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'UKRAINE_WAR', label: 'Ukraine War', type: 'CONFLICT_ZONE', domain: 'defense', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'CLIMATE_ACCORD', label: 'Paris Agreement', type: 'TREATY', domain: 'climate', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'ARCTIC_ICE', label: 'Arctic Ice Loss', type: 'CONFLICT_ZONE', domain: 'climate', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'OPEC', label: 'OPEC', type: 'ORGANIZATION', domain: 'economics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'TSMC', label: 'TSMC', type: 'ORGANIZATION', domain: 'technology', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'TAIWAN', label: 'Taiwan', type: 'NATION', domain: 'geopolitics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'HAMAS', label: 'Hamas', type: 'ORGANIZATION', domain: 'defense', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'HEZBOLLAH', label: 'Hezbollah', type: 'MILITARY_UNIT', domain: 'defense', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'US_SANCTIONS', label: 'US Sanctions Regime', type: 'SANCTION', domain: 'economics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
  { id: 'INDIA_GDP', label: 'India GDP Growth', type: 'ECONOMIC_INDICATOR', domain: 'economics', first_seen: '2025-01-01T00:00:00Z', last_seen: new Date().toISOString() },
]

export const MOCK_EDGES: TypedEdge[] = [
  { source: 'CHINA', target: 'INDIA', type: 'THREATENS', confidence: 0.82, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 12, evidence: ['https://thehindu.com/1', 'https://bbc.com/2'], stale: false },
  { source: 'CHINA', target: 'TAIWAN', type: 'THREATENS', confidence: 0.91, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 18, evidence: [], stale: false },
  { source: 'CHINA', target: 'TSMC', type: 'CONTROLS', confidence: 0.55, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 5, evidence: [], stale: false },
  { source: 'USA', target: 'TAIWAN', type: 'SUPPORTS', confidence: 0.88, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 14, evidence: [], stale: false },
  { source: 'USA', target: 'UKRAINE', type: 'FUNDS', confidence: 0.79, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 22, evidence: [], stale: false },
  { source: 'RUSSIA', target: 'UKRAINE_WAR', type: 'CAUSES', confidence: 0.98, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 45, evidence: [], stale: false },
  { source: 'RUSSIA', target: 'NATO', type: 'THREATENS', confidence: 0.76, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 30, evidence: [], stale: false },
  { source: 'IRAN', target: 'ISRAEL', type: 'THREATENS', confidence: 0.31, first_seen: '2025-01-01T00:00:00Z', last_confirmed: '2025-12-01T00:00:00Z', source_count: 8, evidence: [], stale: false },
  { source: 'IRAN', target: 'HAMAS', type: 'FUNDS', confidence: 0.73, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 11, evidence: [], stale: false },
  { source: 'IRAN', target: 'HEZBOLLAH', type: 'CONTROLS', confidence: 0.80, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 9, evidence: [], stale: false },
  { source: 'PAKISTAN', target: 'INDIA', type: 'THREATENS', confidence: 0.12, first_seen: '2025-01-01T00:00:00Z', last_confirmed: '2025-08-01T00:00:00Z', source_count: 4, evidence: [], stale: true },
  { source: 'PAKISTAN', target: 'CHINA', type: 'ALLIES_WITH', confidence: 0.85, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 16, evidence: [], stale: false },
  { source: 'INDIA', target: 'QUAD', type: 'ALLIES_WITH', confidence: 0.77, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 7, evidence: [], stale: false },
  { source: 'USA', target: 'QUAD', type: 'CONTROLS', confidence: 0.65, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 6, evidence: [], stale: false },
  { source: 'OPEC', target: 'CRUDE_OIL', type: 'CONTROLS', confidence: 0.89, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 20, evidence: [], stale: false },
  { source: 'US_SANCTIONS', target: 'IRAN', type: 'SANCTIONS', confidence: 0.92, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 25, evidence: [], stale: false },
  { source: 'US_SANCTIONS', target: 'RUSSIA', type: 'SANCTIONS', confidence: 0.94, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 28, evidence: [], stale: false },
  { source: 'INDIA', target: 'RUSSIA', type: 'TRADES_WITH', confidence: 0.70, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 14, evidence: [], stale: false },
  { source: 'IMF', target: 'PAKISTAN', type: 'FUNDS', confidence: 0.83, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 10, evidence: [], stale: false },
  { source: 'UKRAINE_WAR', target: 'CRUDE_OIL', type: 'CAUSES', confidence: 0.67, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 13, evidence: [], stale: false },
  { source: 'CHINA', target: 'SEMICONDUCTOR', type: 'COMPETES_WITH', confidence: 0.72, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 8, evidence: [], stale: false },
  { source: 'USA', target: 'SEMICONDUCTOR', type: 'CONTROLS', confidence: 0.68, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 9, evidence: [], stale: false },
  { source: 'BRICS', target: 'IMF', type: 'COMPETES_WITH', confidence: 0.44, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 5, evidence: [], stale: false },
  { source: 'CHINA', target: 'BRICS', type: 'CONTROLS', confidence: 0.58, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 7, evidence: [], stale: false },
  { source: 'INDIA', target: 'BRICS', type: 'ALLIES_WITH', confidence: 0.60, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 6, evidence: [], stale: false },
  { source: 'ARCTIC_ICE', target: 'CRUDE_OIL', type: 'CAUSES', confidence: 0.50, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 4, evidence: [], stale: false },
  { source: 'CLIMATE_ACCORD', target: 'ARCTIC_ICE', type: 'BLOCKS', confidence: 0.38, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 3, evidence: [], stale: false },
  { source: 'UN', target: 'CLIMATE_ACCORD', type: 'CONTROLS', confidence: 0.72, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 8, evidence: [], stale: false },
  { source: 'AI_ACT', target: 'SEMICONDUCTOR', type: 'BLOCKS', confidence: 0.45, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 4, evidence: [], stale: false },
  { source: 'INDIA', target: 'INDIA_GDP', type: 'CAUSES', confidence: 0.78, first_seen: '2025-01-01T00:00:00Z', last_confirmed: new Date().toISOString(), source_count: 11, evidence: [], stale: false },
]

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert_01', user_id: 'usr_01', entity_id: 'IRAN', entity_label: 'Iran',
    edge_type: 'THREATENS', confidence_before: 0.72, confidence_after: 0.31,
    delta: 0.41, drop_pct: 56.9, message: 'Iran → THREATENS → Israel dropped 56.9%',
    domain: 'geopolitics', read: false, created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'alert_02', user_id: 'usr_01', entity_id: 'PAKISTAN', entity_label: 'Pakistan',
    edge_type: 'THREATENS', confidence_before: 0.55, confidence_after: 0.12,
    delta: 0.43, drop_pct: 78.2, message: 'Pakistan → THREATENS → India dropped 78.2%',
    domain: 'defense', read: false, created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'alert_03', user_id: 'usr_01', entity_id: 'CHINA', entity_label: 'China',
    edge_type: 'THREATENS', confidence_before: 0.90, confidence_after: 0.61,
    delta: 0.29, drop_pct: 32.2, message: 'China → THREATENS → India dropped 32.2%',
    domain: 'geopolitics', read: true, created_at: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'alert_04', user_id: 'usr_01', entity_id: 'RUSSIA', entity_label: 'Russia',
    edge_type: 'THREATENS', confidence_before: 0.80, confidence_after: 0.50,
    delta: 0.30, drop_pct: 37.5, message: 'Russia → THREATENS → NATO dropped 37.5%',
    domain: 'defense', read: false, created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'alert_05', user_id: 'usr_01', entity_id: 'CLIMATE_ACCORD', entity_label: 'Paris Agreement',
    edge_type: 'BLOCKS', confidence_before: 0.68, confidence_after: 0.38,
    delta: 0.30, drop_pct: 44.1, message: 'Paris Agreement → BLOCKS → Arctic Ice Loss dropped 44.1%',
    domain: 'climate', read: true, created_at: new Date(Date.now() - 172800000).toISOString(),
  },
]

export const MOCK_BLAST_RESULT: BlastRadiusResult = {
  entity: 'PAKISTAN',
  entity_found: 'PAKISTAN',
  total_affected: 8,
  max_depth: 3,
  depth_summary: {
    1: { count: 3, top_entity: 'India', top_confidence: 0.85 },
    2: { count: 3, top_entity: 'QUAD Alliance', top_confidence: 0.65 },
    3: { count: 2, top_entity: 'United States', top_confidence: 0.51 },
  },
  paths: [
    { entity: 'INDIA', label: 'India', entity_type: 'NATION', domain: 'geopolitics', depth: 1, path: ['PAKISTAN','INDIA'], path_labels: ['Pakistan','India'], joint_confidence: 0.85, evidence: [] },
    { entity: 'CHINA', label: 'China', entity_type: 'NATION', domain: 'geopolitics', depth: 1, path: ['PAKISTAN','CHINA'], path_labels: ['Pakistan','China'], joint_confidence: 0.83, evidence: [] },
    { entity: 'IMF', label: 'IMF', entity_type: 'ORGANIZATION', domain: 'economics', depth: 1, path: ['PAKISTAN','IMF'], path_labels: ['Pakistan','IMF'], joint_confidence: 0.70, evidence: [] },
    { entity: 'QUAD', label: 'QUAD Alliance', entity_type: 'ALLIANCE', domain: 'defense', depth: 2, path: ['PAKISTAN','INDIA','QUAD'], path_labels: ['Pakistan','India','QUAD Alliance'], joint_confidence: 0.65, evidence: [] },
    { entity: 'LAC', label: 'Line of Actual Control', entity_type: 'CONFLICT_ZONE', domain: 'defense', depth: 2, path: ['PAKISTAN','INDIA','LAC'], path_labels: ['Pakistan','India','LAC'], joint_confidence: 0.62, evidence: [] },
    { entity: 'BRICS', label: 'BRICS', entity_type: 'ALLIANCE', domain: 'economics', depth: 2, path: ['PAKISTAN','CHINA','BRICS'], path_labels: ['Pakistan','China','BRICS'], joint_confidence: 0.48, evidence: [] },
    { entity: 'USA', label: 'United States', entity_type: 'NATION', domain: 'geopolitics', depth: 3, path: ['PAKISTAN','INDIA','QUAD','USA'], path_labels: ['Pakistan','India','QUAD Alliance','United States'], joint_confidence: 0.51, evidence: [] },
    { entity: 'TAIWAN', label: 'Taiwan', entity_type: 'NATION', domain: 'geopolitics', depth: 3, path: ['PAKISTAN','CHINA','TAIWAN'], path_labels: ['Pakistan','China','Taiwan'], joint_confidence: 0.44, evidence: [] },
  ],
  synthesis: `Pakistan's economic instability creates a multi-domain cascade across South Asia and beyond.

**Primary Effects (Depth 1):**
• India faces increased border pressure at the LAC as Pakistan seeks to divert domestic attention through geopolitical posturing (confidence: 85%)
• China deepens economic leverage over Pakistan, consolidating Belt & Road dependency (confidence: 83%)
• IMF exposure increases as Pakistan draws further on crisis credit facilities (confidence: 70%)

**Secondary Effects (Depth 2):**
• QUAD alliance cohesion strengthens as India signals alignment with democratic partners to counter Chinese opportunism (confidence: 65%)
• Chinese gains in Pakistan translate into expanded South China Sea assertiveness through resource reallocation (confidence: 48%)

**Strategic Assessment:**
The most critical pathway runs Pakistan → India → QUAD, potentially accelerating regional bloc formation. Decision-makers should monitor India's defense budget revisions and any QUAD joint naval exercises as leading indicators.`,
}

export const MOCK_HISTORY: QueryHistoryItem[] = [
  { id: 'h1', query_text: 'What is the blast radius of Pakistan defaulting?', mode: 'blast_radius', result_snapshot: null, latency_ms: 2340, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'h2', query_text: 'How does Iran-Israel tension affect oil markets?', mode: 'hybrid', result_snapshot: null, latency_ms: 1820, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'h3', query_text: 'Status of China-Taiwan relations', mode: 'global', result_snapshot: null, latency_ms: 2100, created_at: new Date(Date.now() - 86400000).toISOString() },
]

export const MOCK_REPORTS: Report[] = [
  { id: 'r1', title: 'Pakistan Default Cascade Analysis', entity: 'PAKISTAN', blast_radius_snapshot: MOCK_BLAST_RESULT, created_at: new Date(Date.now() - 3600000).toISOString() },
]

export const MOCK_WATCHLIST: WatchlistItem[] = [
  { id: 'w1', user_id: 'usr_01', entity_id: 'IRAN', entity_label: 'Iran', entity_type: 'NATION', alert_threshold: 0.30, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'w2', user_id: 'usr_01', entity_id: 'CHINA', entity_label: 'China', entity_type: 'NATION', alert_threshold: 0.25, created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 'w3', user_id: 'usr_01', entity_id: 'PAKISTAN', entity_label: 'Pakistan', entity_type: 'NATION', alert_threshold: 0.35, created_at: new Date(Date.now() - 259200000).toISOString() },
]

export const MOCK_GRAPH: GraphData = {
  nodes: MOCK_ENTITIES,
  edges: MOCK_EDGES,
  total_nodes: MOCK_ENTITIES.length,
  total_edges: MOCK_EDGES.length,
}

export const MOCK_CONFIDENCE_DATA = {
  histogram: {
    '0.00-0.15': 3, '0.15-0.30': 5, '0.30-0.50': 8,
    '0.50-0.70': 9, '0.70-0.85': 12, '0.85-1.01': 6,
  },
  domain_summary: {
    geopolitics: { avg_confidence: 0.72, min_confidence: 0.12, max_confidence: 0.98, edge_count: 14, stale_count: 1 },
    economics:   { avg_confidence: 0.64, min_confidence: 0.38, max_confidence: 0.94, edge_count: 8,  stale_count: 0 },
    defense:     { avg_confidence: 0.70, min_confidence: 0.31, max_confidence: 0.92, edge_count: 9,  stale_count: 0 },
    technology:  { avg_confidence: 0.55, min_confidence: 0.38, max_confidence: 0.75, edge_count: 4,  stale_count: 0 },
    climate:     { avg_confidence: 0.50, min_confidence: 0.30, max_confidence: 0.72, edge_count: 3,  stale_count: 0 },
    society:     { avg_confidence: 0.45, min_confidence: 0.30, max_confidence: 0.62, edge_count: 2,  stale_count: 0 },
  },
  total_edges: 43, active_edges: 40, stale_edges: 3, archived_edges: 0,
  run_at: new Date().toISOString(),
}
