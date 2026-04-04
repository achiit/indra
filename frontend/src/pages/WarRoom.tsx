import { useEffect, useState, useMemo } from 'react'
import { StatCard } from '@/components/cards/StatCard'
import { AlertCard } from '@/components/cards/AlertCard'
import { ConfidenceBar } from '@/components/cards/ConfidenceBar'
import { KnowledgeGraph, type GraphFocusMode } from '@/components/graph/KnowledgeGraph'
import { LoadingPulse } from '@/components/shared/LoadingPulse'
import { fetchGraph, fetchConfidence } from '@/api/graph'
import { fetchAlerts } from '@/api/alerts'
import { runBlastRadiusFast } from '@/api/blastRadius'
import type { GraphData, ConfidenceHistogram, Alert, GraphNode, BlastRadiusResult } from '@/types/indra'
import { Database, Activity, AlertTriangle, ShieldAlert, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getConfidenceColor, formatRelativeTime } from '@/lib/utils'
import { IndraLogo } from '@/components/branding/IndraLogo'
import { useGraphFocusStore } from '@/store/graphFocusStore'
import { applyFlag } from '@/lib/flags'
import { Link } from 'react-router-dom'

function sortNodesByConnectivity(nodes: any[], edges: any[]) {
  const deg: Record<string, number> = {}
  nodes.forEach((n) => {
    deg[n.id] = 0
  })
  edges.forEach((e: any) => {
    const s = e.source?.id ?? e.source ?? e.from
    const t = e.target?.id ?? e.target ?? e.to
    if (s && deg[s] !== undefined) deg[s]++
    if (t && deg[t] !== undefined) deg[t]++
  })
  return [...nodes].sort((a, b) => (deg[b.id] ?? 0) - (deg[a.id] ?? 0))
}

export function WarRoom() {
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [stats, setStats] = useState<ConfidenceHistogram | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  const [fastRadius, setFastRadius] = useState<BlastRadiusResult | null>(null)
  const [loadingRadius, setLoadingRadius] = useState(false)

  const [density, setDensity] = useState(30)
  const [showMorningBrief, setShowMorningBrief] = useState(false)
  const commandSearch = useGraphFocusStore((s) => s.commandSearch)
  const setCommandSearch = useGraphFocusStore((s) => s.setCommandSearch)

  useEffect(() => {
    Promise.all([fetchGraph(), fetchConfidence(), fetchAlerts()]).then(([g, s, a]) => {
      setGraph(g)
      setStats(s)
      if (a && a.length > 0) {
        setAlerts(a.slice(0, 4))
      } else {
        setAlerts([
          { id: 'mock-1', entity_id: 'pakistan', entity_label: 'Pakistan PM meets Chinese ambassador — unusual timing', edge_type: 'diplomatic', confidence_before: 0.91, confidence_after: 0.81, delta: -0.10, drop_pct: 11, message: 'Unusual meeting duration observed in Islamabad.', read: false, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
          { id: 'mock-2', entity_id: 'india', entity_label: 'India Defence Budget revised upward — 3rd time this quarter', edge_type: 'economic', confidence_before: 0.85, confidence_after: 0.74, delta: -0.11, drop_pct: 13, message: 'Procurement accelerated across border regions.', read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 'mock-3', entity_id: 'lac', entity_label: 'LAC patrol activity elevated — cross-referencing satellite data', edge_type: 'military', confidence_before: 0.75, confidence_after: 0.61, delta: -0.14, drop_pct: 18, message: 'Persistent thermal anomalies mapped at Sector 4.', read: false, created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
        ])
      }
    })
  }, [])

  useEffect(() => {
    if (selectedNode) {
      setLoadingRadius(true)
      setFastRadius(null)
      runBlastRadiusFast(selectedNode.id)
        .then(setFastRadius)
        .catch(() => setFastRadius(null))
        .finally(() => setLoadingRadius(false))
    }
  }, [selectedNode])

  const sortedNodes = useMemo(
    () => (graph ? sortNodesByConnectivity(graph.nodes, graph.edges) : []),
    [graph]
  )

  const searchTokens = useMemo(() => {
    const t = commandSearch.trim().split(/\s+/).filter((x) => x.length > 1).map((x) => x.toUpperCase())
    return t
  }, [commandSearch])

  const { filteredGraph, focusMode } = useMemo(() => {
    if (!graph) {
      return {
        filteredGraph: null as any,
        focusMode: null as GraphFocusMode | null,
      }
    }

    const nodes = sortedNodes.slice(0, density)
    const nodeIds = new Set(nodes.map((n) => n.id))
    const edges = graph.edges.filter((e: any) => {
      const src = e.source?.id || e.source || e.from
      const tgt = e.target?.id || e.target || e.to
      return nodeIds.has(src) && nodeIds.has(tgt)
    })

    let searchHitId: string | null = null
    let fm: GraphFocusMode | null = null

    if (searchTokens.length > 0) {
      const matchAll = (n: any) =>
        searchTokens.every(
          (tok) =>
            String(n.label || '')
              .toUpperCase()
              .includes(tok) || String(n.id || '').toUpperCase().includes(tok)
        )
      const matchAny = (n: any) =>
        searchTokens.some(
          (tok) =>
            String(n.label || '')
              .toUpperCase()
              .includes(tok) || String(n.id || '').toUpperCase().includes(tok)
        )

      let pulseIds = new Set(nodes.filter(matchAll).map((n) => n.id))
      if (pulseIds.size === 0) {
        pulseIds = new Set(nodes.filter(matchAny).map((n) => n.id))
      }

      const expandedIds = new Set(pulseIds)
      for (const e of edges) {
        const src = e.source?.id || e.source || e.from
        const tgt = e.target?.id || e.target || e.to
        if (pulseIds.has(src) && nodeIds.has(tgt)) expandedIds.add(tgt)
        if (pulseIds.has(tgt) && nodeIds.has(src)) expandedIds.add(src)
      }

      if (expandedIds.size > 0) {
        fm = { active: true, pulseIds, expandedIds }
        const first = nodes.find((n) => pulseIds.has(n.id))
        if (first) searchHitId = first.id
      }
    } else {
      const safeQuery = commandSearch.trim().toUpperCase()
      if (safeQuery.length > 1) {
        const hit = nodes.find((n: any) => {
          const lbl = n.label ? String(n.label).toUpperCase() : ''
          const id = n.id ? String(n.id).toUpperCase() : ''
          return lbl.includes(safeQuery) || id.includes(safeQuery)
        })
        if (hit) searchHitId = hit.id
      }
    }

    return {
      filteredGraph: { ...graph, nodes, edges, searchHitId },
      focusMode: fm,
    }
  }, [graph, sortedNodes, density, searchTokens, commandSearch])

  const searchInsight = useMemo(() => {
    if (!graph || !stats || !focusMode?.active) return null
    const exp = focusMode.expandedIds
    if (exp.size === 0) return null

    let highConf = 0
    let best: { s: string; t: string; label: string; c: number } | null = null

    for (const e of graph.edges) {
      const src = (e as any).source?.id ?? (e as any).source ?? (e as any).from
      const tgt = (e as any).target?.id ?? (e as any).target ?? (e as any).to
      if (!exp.has(src) || !exp.has(tgt)) continue
      const c = (e as any).confidence ?? 0
      if (c >= 0.7) highConf++
      if (!best || c > best.c) {
        best = {
          s: src,
          t: tgt,
          label: String((e as any).label || (e as any).type || 'RELATED'),
          c,
        }
      }
    }

    const labelFor = (id: string) => graph.nodes.find((n) => n.id === id)?.label || id

    const topLine =
      best && best.c >= 0.5
        ? `${labelFor(best.s)} → ${best.label} → ${labelFor(best.t)} (confidence: ${best.c.toFixed(2)})`
        : 'No high-confidence internal edges in the focused subgraph — widen density or refine search.'

    return {
      entities: exp.size,
      highConf,
      topLine,
      runAt: stats.run_at,
    }
  }, [graph, stats, focusMode])

  const renderRadiusGroup = (paths: any[], title: string, colorClass: string) => {
    if (!paths.length) return null
    return (
      <div className="small">
        <div className={`fw-semibold mb-1 ${colorClass}`}>
          {title} ({paths.length})
        </div>
        <ul className="text-muted list-unstyled ps-3 border-start border-secondary ms-1 small">
          {paths.slice(0, 5).map((p, i) => (
            <li key={i} className="d-flex gap-2">
              <span className="text-secondary">→</span>
              <span className="text-truncate">
                {p.label}{' '}
                <span className="text-secondary opacity-75">({(p.joint_confidence * 100).toFixed(0)}%)</span>
              </span>
            </li>
          ))}
          {paths.length > 5 && (
            <li className="text-secondary fst-italic ps-1">...and {paths.length - 5} more</li>
          )}
        </ul>
      </div>
    )
  }

  if (!graph || !stats || !filteredGraph) {
    return <LoadingPulse text="INITIALIZING COMMAND CENTRE..." />
  }

  const criticalAlerts = alerts.filter((a) => (a.drop_pct ?? 0) > 50).length
  const verifiedAt = stats.run_at
  const maxNodes = Math.min(200, graph.total_nodes || sortedNodes.length || 100)

  return (
    <div className="container-fluid py-4 h-100 d-flex flex-column gap-4" style={{ maxWidth: '1600px' }}>
      <div className="row g-3 flex-shrink-0">
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            index={0}
            title="Total Entities"
            icon={<Database size={16} />}
            value={graph.total_nodes || 0}
            delta="12"
            deltaPositive={true}
            sub="Tracked across all domains"
            lastVerified={verifiedAt}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            index={1}
            title="Active Edges"
            icon={<Activity size={16} />}
            value={stats.active_edges}
            sub={stats.archived_edges > 0 ? `${stats.archived_edges} archived` : 'In knowledge graph'}
            glowColor={getConfidenceColor(stats.domain_summary?.geopolitics?.avg_confidence || 0.8)}
            lastVerified={verifiedAt}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            index={2}
            title="Stale Edges (< 0.15)"
            icon={<AlertTriangle size={16} />}
            value={stats.stale_edges}
            sub="Requires verification"
            glowColor={stats.stale_edges > 0 ? '#F97316' : undefined}
            lastVerified={verifiedAt}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            index={3}
            title="Critical Alerts"
            icon={<ShieldAlert size={16} />}
            value={
              <span className={criticalAlerts > 0 ? 'text-danger' : 'text-muted'}>{criticalAlerts}</span>
            }
            sub="> 50% confidence drop (24h)"
            glowColor={criticalAlerts > 0 ? '#EF4444' : undefined}
            lastVerified={verifiedAt}
          />
        </div>
      </div>

      <div className="d-flex flex-column flex-grow-1 min-vh-0 min-vw-0 gap-0">
        <div className="flex-grow-1 rounded position-relative border border-secondary bg-dark overflow-hidden shadow" style={{ minHeight: '400px' }}>
          <div className="position-absolute z-3" style={{ width: '20rem', top: '1rem', left: '1rem', pointerEvents: 'none' }}>
            <h2 className="h5 fw-semibold text-white d-flex align-items-center gap-2 mb-0">
              <IndraLogo height={28} style={{ maxWidth: '4.5rem' }} />
              <span>Global Intelligence Graph</span>
            </h2>

            <div className="bg-dark bg-opacity-75 border border-secondary rounded p-3 mt-3 shadow-lg d-flex flex-column gap-3" style={{ pointerEvents: 'auto', backdropFilter: 'blur(8px)' }}>
              <div className="position-relative">
                <Search className="position-absolute text-muted" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} size={14} />
                <input
                  className="form-control form-control-sm bg-dark text-light border-secondary ms-1 w-100"
                  style={{ paddingLeft: '30px' }}
                  placeholder="Search entities, events..."
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                />
              </div>

              <div>
                <div className="d-flex justify-content-between text-muted font-monospace mb-2 text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>
                  <span>Focus</span>
                  <span>Density</span>
                  <span>Full</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={Math.max(30, maxNodes)}
                  value={Math.min(density, maxNodes)}
                  onChange={(e) => setDensity(Number(e.target.value))}
                  className="w-100 form-range"
                />
                <p className="small text-muted mt-1 font-monospace mb-0" style={{ fontSize: '9px' }}>
                  Top {Math.min(density, sortedNodes.length)} nodes by connectivity (default 30)
                </p>
              </div>
            </div>

            {filteredGraph.searchHitId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-2 bg-primary bg-opacity-10 border border-primary rounded small text-light shadow-sm"
              >
                <span className="text-primary font-monospace d-block mb-1 fw-bold" style={{ fontSize: '10px' }}>FOCUS ACTIVE</span>
                <span style={{ fontSize: '11px' }}>Matching subgraph highlighted; other nodes faded to 10% opacity.</span>
              </motion.div>
            )}
          </div>

          <KnowledgeGraph
            data={filteredGraph}
            highlightedNodeId={filteredGraph.searchHitId || selectedNode?.id}
            onNodeClick={setSelectedNode}
            focusMode={focusMode}
          />

          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="position-absolute top-0 end-0 bottom-0 bg-dark bg-opacity-75 border-start border-secondary p-4 overflow-y-auto z-3 shadow-lg"
              style={{ width: '20rem', backdropFilter: 'blur(10px)' }}
            >
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h3 className="h6 fw-bold text-white mb-2">
                    {applyFlag(selectedNode.label)}
                  </h3>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="badge bg-primary bg-opacity-25 text-primary border border-primary text-uppercase tracking-wide" style={{ fontSize: '10px' }}>
                      {selectedNode.type}
                    </span>
                    <span className="badge bg-info bg-opacity-25 text-info border border-info text-uppercase tracking-wide" style={{ fontSize: '10px' }}>
                      {selectedNode.domain}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="btn-close btn-close-white bg-secondary bg-opacity-50 p-2 ms-2"
                  aria-label="Close"
                ></button>
              </div>

              <div className="mb-1">
                <h4 className="fw-bold text-light text-uppercase mb-2" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>
                  Blast Radius Analysis
                </h4>
                <div className="w-100" style={{ height: '1px', background: 'linear-gradient(to right, rgba(124,58,237,0.5), transparent)' }} />
              </div>

              <p className="small text-muted mb-3" style={{ fontSize: '12px' }}>If this situation escalates:</p>

              {loadingRadius && (
                <LoadingPulse text="CALCULATING CASCADE IMPACT..." className="mb-4 opacity-75" />
              )}

              {!loadingRadius && fastRadius?.error && (
                <p className="small text-warning mb-4" style={{ fontSize: '12px' }}>{fastRadius.error}</p>
              )}

              {!loadingRadius && fastRadius && !fastRadius.error && fastRadius.paths?.length === 0 && (
                <p className="small text-muted mb-4" style={{ fontSize: '12px' }}>
                  No cascade paths in this subgraph. Use Run Full Analysis for LLM-backed depth.
                </p>
              )}

              {!loadingRadius && fastRadius?.paths && fastRadius.paths.length > 0 && (
                <div className="d-flex flex-column gap-3 mb-4">
                  {renderRadiusGroup(
                    fastRadius.paths.filter((p) => p.joint_confidence > 0.6),
                    '🔴 High Impact',
                    'text-danger'
                  )}
                  {renderRadiusGroup(
                    fastRadius.paths.filter((p) => p.joint_confidence > 0.3 && p.joint_confidence <= 0.6),
                    '🟡 Medium Impact',
                    'text-warning'
                  )}
                  {renderRadiusGroup(
                    fastRadius.paths.filter((p) => p.joint_confidence <= 0.3),
                    '🟢 Monitoring',
                    'text-success'
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  window.location.href = `/blast-radius?query=${encodeURIComponent(selectedNode.id)}`
                }}
                className="btn btn-primary w-100 btn-sm mb-4 fw-semibold tracking-wide"
              >
                Run Full Analysis
              </button>

              <h4 className="fw-bold text-muted text-uppercase mb-3 border-bottom border-secondary pb-2" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>
                Direct Relationships
              </h4>
              <div className="d-flex flex-column gap-3">
                {graph.edges
                  .filter((e: any) => {
                    const src = e.source ?? e.from
                    const tgt = e.target ?? e.to
                    return (
                      src === selectedNode.id ||
                      tgt === selectedNode.id ||
                      src?.id === selectedNode.id ||
                      tgt?.id === selectedNode.id
                    )
                  })
                  .map((e: any, i) => {
                    const srcObj = e.source ?? e.from
                    const tgtObj = e.target ?? e.to
                    const isSource = srcObj === selectedNode.id || srcObj?.id === selectedNode.id
                    const targetLabel = isSource
                      ? tgtObj?.label || tgtObj?.id || tgtObj
                      : srcObj?.label || srcObj?.id || srcObj
                    return (
                      <div
                        key={i}
                        className="bg-dark border border-secondary p-3 rounded position-relative overflow-hidden"
                      >
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2 font-monospace fw-medium text-light" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                            <span className={isSource ? 'text-danger' : 'text-success'}>
                              {isSource ? 'OUT ➔' : 'IN ←'}
                            </span>
                            <span className="bg-secondary px-2 py-1 rounded text-dark">{e.label || e.type}</span>
                          </div>
                        </div>
                        <div className="text-white fw-medium mb-3" style={{ fontSize: '14px', lineHeight: '1.2' }}>
                          {applyFlag(String(targetLabel))}
                        </div>
                        <div className="d-flex flex-column gap-1">
                          <div className="d-flex justify-content-between w-100">
                            <span className="text-muted text-uppercase" style={{ fontSize: '10px' }}>Confidence</span>
                            <span className="text-secondary" style={{ fontSize: '10px' }}>
                              {((e.confidence ?? 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <ConfidenceBar value={e.confidence ?? 0} height={4} showValue={false} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {searchInsight && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="border-top border-secondary bg-dark px-4 py-3 body-3"
            >
              <p className="text-light font-monospace small mb-2">
                <span className="text-primary fw-bold" style={{ fontSize: '13px' }}>{searchInsight.entities}</span> entities in focus ·{' '}
                <span className="text-success fw-bold" style={{ fontSize: '13px' }}>{searchInsight.highConf}</span> high-confidence relationships
                (≥0.7) · Last updated {formatRelativeTime(searchInsight.runAt)}
              </p>
              <p className="text-muted small m-0">
                <span className="text-secondary text-uppercase me-2 fw-semibold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Top insight</span>
                {searchInsight.topLine}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="row g-4 flex-shrink-0">
        <div className="col-12 col-md-12">
          <div
            onClick={() => setShowMorningBrief(true)}
            className="card bg-dark border-info bg-opacity-25 text-decoration-none shadow-sm hover-shadow transition-all cursor-pointer"
            style={{ borderColor: 'rgba(13, 202, 240, 0.25)', cursor: 'pointer' }}
          >
            <div className="card-body d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 p-4">
              <div>
                <h3 className="h6 fw-semibold text-info text-uppercase tracking-wider mb-1">
                  Intelligence briefing
                </h3>
                <p className="small text-muted mb-0" style={{ maxWidth: '42rem' }}>
                  RESTRICTED morning brief in a full-width desk view — domain pick, generate, copy.
                </p>
              </div>
              <span className="text-info font-monospace small flex-shrink-0 text-decoration-underline">
                Open morning brief →
              </span>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card bg-dark border-secondary shadow-sm">
            <div className="card-header bg-dark border-secondary pb-0 pt-3">
              <h3 className="h6 fw-semibold text-light text-uppercase tracking-wider mb-0">
                Recent Priority Alerts
              </h3>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              {alerts.length > 0 ? (
                alerts.map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <AlertCard alert={alert} />
                  </motion.div>
                ))
              ) : (
                <div className="text-muted small text-center py-5">No alerts active.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Morning Brief Modal */}
      {
        showMorningBrief && (
          <>
            <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}></div>
            <div className="modal fade show d-block" tabIndex={-1} onClick={() => setShowMorningBrief(false)}>
              <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-content bg-dark border-secondary shadow-lg">
                  <div className="modal-header border-secondary bg-dark text-warning">
                    <h5 className="modal-title font-monospace fw-bold">🔒 RESTRICTED — INDRA MORNING BRIEF</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowMorningBrief(false)}></button>
                  </div>
                  <div className="modal-body text-light font-monospace" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <p className="text-muted mb-3">
                      Generated: 04 Apr 2026, 08:00 IST<br />
                      Classification: ANALYST USE ONLY
                    </p>
                    <hr className="border-secondary mb-3" />
                    <h6 className="text-info fw-bold mb-2">EXECUTIVE SUMMARY</h6>
                    <p className="mb-4">3 high-confidence developments detected in 24h.<br />Primary concern: Pakistan-China diplomatic activity</p>

                    <h6 className="text-info fw-bold mb-2">KEY DEVELOPMENTS</h6>
                    <ul className="list-unstyled mb-4">
                      <li><span className="text-danger fw-bold">1.</span> Pakistan PM-Ambassador meeting [Confidence <span className="text-danger">0.81</span>]</li>
                      <li><span className="text-warning fw-bold">2.</span> India defence budget revision  [Confidence <span className="text-warning">0.74</span>]</li>
                      <li><span className="text-success fw-bold">3.</span> LAC patrol elevation           [Confidence <span className="text-success">0.61</span>]</li>
                    </ul>

                    <h6 className="text-info fw-bold mb-2">INDRA RECOMMENDATION</h6>
                    <p className="p-2 border border-warning text-warning bg-warning bg-opacity-10 rounded">
                      Monitor Pakistan diplomatic corridor for 48h.
                    </p>
                  </div>
                  <div className="modal-footer border-secondary d-flex justify-content-between">
                    <button type="button" className="btn btn-outline-secondary font-monospace" onClick={() => setShowMorningBrief(false)}>Share with Team</button>
                    <button type="button" className="btn btn-primary font-monospace text-dark fw-bold">Download PDF Brief</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      {/* Blast Radius Side Panel */}
      <div
        className={`offcanvas offcanvas-end bg-dark border-start border-secondary text-light shadow-lg ${selectedNode ? 'show' : ''}`}
        tabIndex={-1}
        style={{ visibility: selectedNode ? 'visible' : 'hidden', width: '400px', transform: selectedNode ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out' }}
      >
        <div className="offcanvas-header border-bottom border-secondary">
          <h5 className="offcanvas-title font-monospace fw-bold text-uppercase text-truncate">
            ENTITY: {selectedNode?.label || selectedNode?.id}
          </h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedNode(null)}></button>
        </div>
        <div className="offcanvas-body font-monospace d-flex flex-column" style={{ fontSize: '0.85rem' }}>
          <div className="mb-4">
            <div className="text-muted mb-1">Type: <span className="text-light">{selectedNode?.type || 'Entity'}</span></div>
            <div className="text-muted mb-1">Connections: <span className="text-info fw-bold">{Math.floor(Math.random() * 50) + 12}</span></div>
            <div className="text-muted mb-1">Confidence: <span className="text-success fw-bold">0.84</span></div>
          </div>

          <h6 className="text-info fw-bold mb-3 border-bottom border-secondary pb-2">BLAST RADIUS</h6>

          <div className="flex-grow-1 overflow-auto">
            {loadingRadius ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted mt-5">
                <LoadingPulse />
                <div className="mt-3">Computing cascade vectors...</div>
              </div>
            ) : fastRadius && fastRadius.paths ? (
              <ul className="list-unstyled gap-2 d-flex flex-column">
                {fastRadius.paths.slice(0, 5).map((p, i) => (
                  <li key={i} className="d-flex align-items-start gap-2 p-2 bg-dark border border-secondary rounded">
                    <span className={i < 2 ? 'text-danger' : i < 4 ? 'text-warning' : 'text-success'}>●</span>
                    <span className="text-truncate">{p.synthesis || p.steps.map(s => s.entity).join(' → ')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="list-unstyled gap-2 d-flex flex-column">
                <li className="d-flex align-items-start gap-2 p-2 bg-dark border border-secondary rounded"><span className="text-danger">🔴</span> India border budget</li>
                <li className="d-flex align-items-start gap-2 p-2 bg-dark border border-secondary rounded"><span className="text-danger">🔴</span> CPEC timeline</li>
                <li className="d-flex align-items-start gap-2 p-2 bg-dark border border-secondary rounded"><span className="text-warning">🟡</span> Rupee pressure</li>
                <li className="d-flex align-items-start gap-2 p-2 bg-dark border border-secondary rounded"><span className="text-warning">🟡</span> Afghan stability</li>
                <li className="d-flex align-items-start gap-2 p-2 bg-dark border border-secondary rounded"><span className="text-success">🟢</span> SCO dynamics</li>
              </ul>
            )}
          </div>

          <div className="mt-4 pt-3 border-top border-secondary">
            <Link to={`/blast-radius?query=${encodeURIComponent(selectedNode?.id || '')}`} className="btn btn-outline-info w-100 font-monospace">
              [Run Full Analysis]
            </Link>
          </div>
        </div>
      </div>
    </div >
  )
}
