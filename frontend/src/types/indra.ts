// ── Core ontology types matching INDRA backend ─────────────────────────
export type EntityType =
  | 'NATION' | 'LEADER' | 'ORGANIZATION' | 'MILITARY_UNIT'
  | 'TREATY' | 'ECONOMIC_INDICATOR' | 'CONFLICT_ZONE' | 'POLICY'
  | 'TECHNOLOGY' | 'NATURAL_RESOURCE' | 'ALLIANCE' | 'SANCTION' | 'UNKNOWN';

export type EdgeType =
  | 'CAUSES' | 'BLOCKS' | 'FUNDS' | 'CONTROLS' | 'THREATENS'
  | 'SUPPORTS' | 'TRADES_WITH' | 'SANCTIONS' | 'ALLIES_WITH'
  | 'COMPETES_WITH' | 'RELATED_TO';

export type Domain =
  | 'geopolitics' | 'economics' | 'defense'
  | 'technology' | 'climate' | 'society' | 'general';

export interface TypedEntity {
  id: string;
  label: string;
  type: EntityType;
  domain: Domain;
  first_seen: string;   // ISO timestamp
  last_seen: string;
}

export interface TypedEdge {
  source: string;       // entity id
  target: string;
  type: EdgeType;
  confidence: number;   // 0–1
  first_seen: string;
  last_confirmed: string;
  source_count: number;
  evidence: string[];   // URLs
  stale: boolean;
}

export interface GraphData {
  nodes: TypedEntity[];
  edges: TypedEdge[];
  total_nodes?: number;
  total_edges?: number;
}

// ── Blast Radius ───────────────────────────────────────────────────────
export interface BlastPath {
  entity: string;
  label: string;
  entity_type: EntityType;
  domain: Domain;
  depth: number;
  path: string[];
  path_labels: string[];
  joint_confidence: number;
  evidence: string[];
}

export interface DepthSummary {
  count: number;
  top_entity: string | null;
  top_confidence: number;
}

export interface BlastRadiusResult {
  entity: string;
  entity_found: string;
  total_affected: number;
  max_depth: number;
  depth_summary: Record<string, DepthSummary>;
  paths: BlastPath[];
  synthesis: string | null;
  error?: string;
  suggestions?: string[];
}

// ── Alerts ────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  user_id?: string;
  entity_id: string;
  entity_label: string;
  edge_type: EdgeType;
  confidence_before: number;
  confidence_after: number;
  delta: number;         // drop percentage
  drop_pct: number;
  message: string;
  domain: Domain;
  read: boolean;
  created_at: string;   // ISO timestamp
}

// ── Confidence Histogram ──────────────────────────────────────────────
export interface ConfidenceHistogram {
  histogram: Record<string, number>;
  domain_summary: Record<string, {
    avg_confidence: number;
    min_confidence: number;
    max_confidence: number;
    edge_count: number;
    stale_count: number;
  }>;
  total_edges: number;
  active_edges: number;
  stale_edges: number;
  archived_edges: number;
  run_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────
export type UserPlan = 'observer' | 'analyst' | 'desk' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: UserPlan;
  created_at: string;
  last_login: string;
}

// ── Watchlist ─────────────────────────────────────────────────────────
export interface WatchlistItem {
  id: string;
  user_id: string;
  entity_id: string;
  entity_label: string;
  entity_type: EntityType;
  alert_threshold: number;
  created_at: string;
}

// ── API Key ───────────────────────────────────────────────────────────
export interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  created_at: string;
  last_used: string | null;
}

// ── Query ─────────────────────────────────────────────────────────────
export type QueryMode = 'hybrid' | 'global' | 'local' | 'blast_radius';

export interface QueryHistoryItem {
  id: string;
  query_text: string;
  mode: QueryMode;
  result_snapshot: Record<string, unknown> | null;
  latency_ms: number;
  created_at: string;
}

export interface QueryResult {
  answer: string;
  question: string;
  blast_radius_data?: BlastRadiusResult;
}

// ── Reports ───────────────────────────────────────────────────────────
export interface Report {
  id: string;
  title: string;
  entity: string;
  blast_radius_snapshot: BlastRadiusResult;
  created_at: string;
}

// ── Force Graph ───────────────────────────────────────────────────────
export interface GraphNode extends TypedEntity {
  val?: number;
  color?: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: EdgeType;
  confidence: number;
  stale: boolean;
  color?: string;
}
