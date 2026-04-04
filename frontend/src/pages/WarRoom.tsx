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
import { Button } from '@/components/ui/button'
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
  const commandSearch = useGraphFocusStore((s) => s.commandSearch)
  const setCommandSearch = useGraphFocusStore((s) => s.setCommandSearch)

  useEffect(() => {
    Promise.all([fetchGraph(), fetchConfidence(), fetchAlerts()]).then(([g, s, a]) => {
      setGraph(g)
      setStats(s)
      setAlerts(a.slice(0, 4))
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
      <div className="text-xs">
        <div className={`font-semibold mb-1 tracking-wide ${colorClass}`}>
          {title} ({paths.length})
        </div>
        <ul className="text-zinc-400 space-y-1 pl-3 border-l border-[#2A2A3A] ml-1">
          {paths.slice(0, 5).map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-zinc-600">→</span>
              <span className="truncate">
                {p.label}{' '}
                <span className="text-zinc-600 opacity-60">({(p.joint_confidence * 100).toFixed(0)}%)</span>
              </span>
            </li>
          ))}
          {paths.length > 5 && (
            <li className="text-zinc-500 italic pl-1">...and {paths.length - 5} more</li>
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
    <div className="p-6 max-w-[1600px] mx-auto h-full min-h-0 flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
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
        <StatCard
          index={1}
          title="Active Edges"
          icon={<Activity size={16} />}
          value={stats.active_edges}
          sub={stats.archived_edges > 0 ? `${stats.archived_edges} archived` : 'In knowledge graph'}
          glowColor={getConfidenceColor(stats.domain_summary?.geopolitics?.avg_confidence || 0.8)}
          lastVerified={verifiedAt}
        />
        <StatCard
          index={2}
          title="Stale Edges (< 0.15)"
          icon={<AlertTriangle size={16} />}
          value={stats.stale_edges}
          sub="Requires verification"
          glowColor={stats.stale_edges > 0 ? '#F97316' : undefined}
          lastVerified={verifiedAt}
        />
        <StatCard
          index={3}
          title="Critical Alerts"
          icon={<ShieldAlert size={16} />}
          value={
            <span className={criticalAlerts > 0 ? 'text-red-400' : 'text-zinc-500'}>{criticalAlerts}</span>
          }
          sub="> 50% confidence drop (24h)"
          glowColor={criticalAlerts > 0 ? '#EF4444' : undefined}
          lastVerified={verifiedAt}
        />
      </div>

      <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-0">
        <div className="flex-1 min-h-[400px] rounded-xl relative border border-[#2A2A3A] bg-[#0A0A0F] overflow-hidden shadow-lg">
          <div className="absolute top-4 left-4 z-10 w-80 pointer-events-none">
            <h2 className="text-xl font-semibold tracking-tight text-white drop-shadow-md flex items-center gap-2">
              <IndraLogo height={28} className="max-w-[4.5rem]" />
              <span>Global Intelligence Graph</span>
            </h2>

            <div className="pointer-events-auto bg-[#16161F]/90 backdrop-blur-md border border-[#2A2A3A] rounded-lg p-3 mt-4 shadow-xl flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded text-xs px-8 py-2 focus:border-purple-500 focus:outline-none placeholder:text-zinc-600 text-zinc-300"
                  placeholder="Search entities, events, or topics…"
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-widest">
                  <span>Focus</span>
                  <span>Graph density</span>
                  <span>Full</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={Math.max(30, maxNodes)}
                  value={Math.min(density, maxNodes)}
                  onChange={(e) => setDensity(Number(e.target.value))}
                  className="w-full h-1 bg-[#2A2A3A] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-[9px] text-zinc-600 mt-1 font-mono">
                  Top {Math.min(density, sortedNodes.length)} nodes by connectivity (default 30)
                </p>
              </div>
            </div>

            {filteredGraph.searchHitId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs shadow-[0_0_15px_rgba(124,58,237,0.1)]"
              >
                <span className="text-purple-300 font-mono block mb-1">FOCUS ACTIVE</span>
                Matching subgraph highlighted; other nodes faded to 10% opacity.
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
              className="absolute top-0 right-0 bottom-0 w-80 bg-[#111118]/95 backdrop-blur-md border-l border-[#2A2A3A] p-5 overflow-y-auto z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {applyFlag(selectedNode.label)}
                  </h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase tracking-wider border border-purple-500/30">
                      {selectedNode.type}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase tracking-wider border border-blue-500/30">
                      {selectedNode.domain}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-zinc-500 hover:text-white p-1 ml-2 bg-[#2A2A3A]/50 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mb-1">
                <h4 className="text-[11px] font-bold text-zinc-200 uppercase tracking-[0.15em]">
                  Blast Radius Analysis
                </h4>
                <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent mt-2 mb-4" />
              </div>

              <p className="text-xs text-zinc-500 mb-3">If this situation escalates:</p>

              {loadingRadius && (
                <LoadingPulse text="CALCULATING CASCADE IMPACT..." className="scale-75 origin-left mb-4 opacity-70" />
              )}

              {!loadingRadius && fastRadius?.error && (
                <p className="text-xs text-amber-400/90 mb-4">{fastRadius.error}</p>
              )}

              {!loadingRadius && fastRadius && !fastRadius.error && fastRadius.paths?.length === 0 && (
                <p className="text-xs text-zinc-500 mb-4">
                  No cascade paths in this subgraph. Use Run Full Analysis for LLM-backed depth.
                </p>
              )}

              {!loadingRadius && fastRadius?.paths && fastRadius.paths.length > 0 && (
                <div className="flex flex-col gap-4 mb-6">
                  {renderRadiusGroup(
                    fastRadius.paths.filter((p) => p.joint_confidence > 0.6),
                    '🔴 High Impact',
                    'text-red-400'
                  )}
                  {renderRadiusGroup(
                    fastRadius.paths.filter((p) => p.joint_confidence > 0.3 && p.joint_confidence <= 0.6),
                    '🟡 Medium Impact',
                    'text-amber-400'
                  )}
                  {renderRadiusGroup(
                    fastRadius.paths.filter((p) => p.joint_confidence <= 0.3),
                    '🟢 Monitoring',
                    'text-emerald-400'
                  )}
                </div>
              )}

              <Button
                type="button"
                onClick={() => {
                  window.location.href = `/blast-radius?query=${encodeURIComponent(selectedNode.id)}`
                }}
                className="w-full bg-purple-600 hover:bg-purple-500 text-xs mb-8 h-9 tracking-wider font-semibold"
              >
                Run Full Analysis
              </Button>

              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 border-b border-[#2A2A3A] pb-2">
                Direct Relationships
              </h4>
              <div className="flex flex-col gap-3">
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
                        className="text-xs bg-[#16161F] border border-[#2A2A3A] p-3 rounded-lg relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 font-mono font-medium text-[10px] tracking-wide text-zinc-300">
                            <span className={isSource ? 'text-red-400' : 'text-emerald-400'}>
                              {isSource ? 'OUT ➔' : 'IN ←'}
                            </span>
                            <span className="bg-[#2A2A3A] px-2 py-0.5 rounded">{e.label || e.type}</span>
                          </div>
                        </div>
                        <div className="text-white font-medium text-sm leading-snug mb-3">
                          {applyFlag(String(targetLabel))}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between w-full">
                            <span className="text-[10px] text-zinc-500 uppercase">Confidence</span>
                            <span className="text-[10px] text-zinc-400">
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
              className="border-t border-[#2A2A3A] bg-[#0d0d14] px-5 py-4 text-sm"
            >
              <p className="text-zinc-300 font-mono text-xs leading-relaxed">
                <span className="text-purple-400">{searchInsight.entities}</span> entities in focus ·{' '}
                <span className="text-emerald-400">{searchInsight.highConf}</span> high-confidence relationships
                (≥0.7) · Last updated {formatRelativeTime(searchInsight.runAt)}
              </p>
              <p className="text-zinc-400 text-xs mt-2">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] mr-2">Top insight</span>
                {searchInsight.topLine}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 gap-6 shrink-0">
        <Link
          to="/briefing"
          className="group rounded-xl border border-teal-500/25 bg-gradient-to-r from-teal-950/35 via-[#111118] to-[#111118] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-teal-500/45 transition-colors"
        >
          <div>
            <h3 className="text-sm font-semibold text-teal-200/95 uppercase tracking-wider">
              Intelligence briefing
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
              RESTRICTED morning brief in a full-width desk view — domain pick, generate, copy.
            </p>
          </div>
          <span className="text-teal-400 text-xs font-mono shrink-0 group-hover:translate-x-1 transition-transform">
            Open morning brief →
          </span>
        </Link>

        <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-sm text-zinc-300 uppercase tracking-wider">
            Recent Priority Alerts
          </h3>
          <div className="flex flex-col gap-3">
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
              <div className="text-sm text-zinc-500 text-center py-8">No alerts active.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
