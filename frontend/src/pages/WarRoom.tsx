import { useEffect, useState } from 'react'
import { StatCard } from '@/components/cards/StatCard'
import { AlertCard } from '@/components/cards/AlertCard'
import { ConfidenceBar } from '@/components/cards/ConfidenceBar'
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph'
import { LoadingPulse } from '@/components/shared/LoadingPulse'
import { fetchGraph, fetchConfidence } from '@/api/graph'
import { fetchAlerts } from '@/api/alerts'
import { runBlastRadiusFast } from '@/api/blastRadius'
import type { GraphData, ConfidenceHistogram, Alert, GraphNode, BlastRadiusResult } from '@/types/indra'
import { Database, Activity, AlertTriangle, ShieldAlert, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { getConfidenceColor } from '@/lib/utils'

export function WarRoom() {
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [stats, setStats] = useState<ConfidenceHistogram | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  
  const [fastRadius, setFastRadius] = useState<BlastRadiusResult | null>(null)
  const [loadingRadius, setLoadingRadius] = useState(false)
  
  const [density, setDensity] = useState(40)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    Promise.all([fetchGraph(), fetchConfidence(), fetchAlerts()]).then(([g, s, a]) => {
      setGraph(g)
      setStats(s)
      setAlerts(a.slice(0, 4)) // Top 4 for dashboard
    })
  }, [])

  useEffect(() => {
    if (selectedNode) {
      setLoadingRadius(true)
      setFastRadius(null)
      runBlastRadiusFast(selectedNode.id).then(res => {
        setFastRadius(res)
        setLoadingRadius(false)
      }).catch(() => setLoadingRadius(false))
    }
  }, [selectedNode])

  if (!graph || !stats) {
    return <LoadingPulse text="INITIALIZING COMMAND CENTRE..." />
  }

  // Filter graph based on density and search
  const filteredGraph = (() => {
    let nodes = [...graph.nodes].slice(0, density)
    let nodeIds = new Set(nodes.map(n => n.id))
    let edges = graph.edges.filter((e: any) => {
        const src = e.source?.id || e.source || e.from
        const tgt = e.target?.id || e.target || e.to
        return nodeIds.has(src) && nodeIds.has(tgt)
    })
    
    let searchHitId = null
    const safeQuery = searchQuery.trim().toUpperCase()
    if (safeQuery.length > 1) {
       const hit = nodes.find((n: any) => {
         const lbl = n.label ? String(n.label).toUpperCase() : ''
         const id = n.id ? String(n.id).toUpperCase() : ''
         return lbl.includes(safeQuery) || id.includes(safeQuery)
       })
       if (hit) searchHitId = hit.id
    }
    return { ...graph, nodes, edges, searchHitId }
  })()

  const renderRadiusGroup = (paths: any[], title: string, colorClass: string) => {
    if (!paths.length) return null;
    return (
      <div className="text-xs">
        <div className={`font-semibold mb-1 tracking-wide ${colorClass}`}>{title} ({paths.length})</div>
        <ul className="text-zinc-400 space-y-1 pl-3 border-l border-[#2A2A3A] ml-1">
          {paths.slice(0, 5).map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-zinc-600">→</span>
              <span className="truncate">{p.label} <span className="text-zinc-600 opacity-60">({(p.joint_confidence*100).toFixed(0)}%)</span></span>
            </li>
          ))}
          {paths.length > 5 && <li className="text-zinc-500 italic pl-1">...and {paths.length - 5} more</li>}
        </ul>
      </div>
    )
  }

  const criticalAlerts = alerts.filter(a => (a.drop_pct ?? 0) > 50).length

  return (
    <div className="p-6 max-w-[1600px] mx-auto h-full flex flex-col gap-6">
      
      {/* Row 1: Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        <StatCard
          index={0} title="Total Entities"
          icon={<Database size={16} />}
          value={graph.total_nodes || 0}
          delta="12" deltaPositive={true} sub="Tracked across all domains"
        />
        <StatCard
          index={1} title="Active Edges"
          icon={<Activity size={16} />}
          value={stats.active_edges}
          sub={stats.archived_edges > 0 ? `${stats.archived_edges} archived` : 'In knowledge graph'}
          glowColor={getConfidenceColor(stats.domain_summary?.geopolitics?.avg_confidence || 0.8)}
        />
        <StatCard
          index={2} title="Stale Edges (< 0.15)"
          icon={<AlertTriangle size={16} />}
          value={stats.stale_edges}
          sub="Requires verification"
          glowColor={stats.stale_edges > 0 ? '#F97316' : undefined}
        />
        <StatCard
          index={3} title="Critical Alerts"
          icon={<ShieldAlert size={16} />}
          value={<span className={criticalAlerts > 0 ? 'text-red-400' : 'text-zinc-500'}>{criticalAlerts}</span>}
          sub="> 50% confidence drop (24h)"
          glowColor={criticalAlerts > 0 ? '#EF4444' : undefined}
        />
      </div>

      {/* Row 2: Graph */}
      <div className="flex-1 min-h-[400px] rounded-xl relative border border-[#2A2A3A] bg-[#0A0A0F] overflow-hidden shadow-lg">
        <div className="absolute top-4 left-4 z-10 w-72 pointer-events-none">
          <h2 className="text-xl font-semibold tracking-tight text-white drop-shadow-md">Global Intelligence Graph</h2>
          
          <div className="pointer-events-auto bg-[#16161F]/90 backdrop-blur-md border border-[#2A2A3A] rounded-lg p-3 mt-4 shadow-xl flex flex-col gap-3">
             <div className="relative">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
               <input 
                 className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded text-xs px-8 py-2 focus:border-purple-500 focus:outline-none placeholder:text-zinc-600 text-zinc-300"
                 placeholder="Search entities to focus..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value.toUpperCase())}
               />
             </div>
             
             <div>
               <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-widest">
                 <span>Focus</span>
                 <span>Graph Density</span>
                 <span>Full</span>
               </div>
               <input 
                 type="range" min={10} max={Math.min(200, graph.total_nodes || 100)} 
                 value={density} onChange={e => setDensity(Number(e.target.value))}
                 className="w-full h-1 bg-[#2A2A3A] rounded-lg appearance-none cursor-pointer accent-purple-500"
               />
             </div>
          </div>

          {filteredGraph.searchHitId && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs pointers-events-none shadow-[0_0_15px_rgba(124,58,237,0.1)]">
              <span className="text-purple-300 font-mono block mb-1">🔍 LOCK ACQUIRED</span>
              Target matched in active set. Irrelevant nodes faded.
            </motion.div>
          )}
        </div>

        <KnowledgeGraph 
          data={filteredGraph} 
          highlightedNodeId={filteredGraph.searchHitId || selectedNode?.id} 
          onNodeClick={setSelectedNode} 
        />
        
        {/* Detail Panel overlay */}
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="absolute top-0 right-0 bottom-0 w-80 bg-[#111118]/90 backdrop-blur-md border-l border-[#2A2A3A] p-5 overflow-y-auto z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{selectedNode.label}</h3>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase tracking-wider border border-purple-500/30">
                    {selectedNode.type}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase tracking-wider border border-blue-500/30">
                    {selectedNode.domain}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white p-1 ml-2 bg-[#2A2A3A]/50 rounded cursor-pointer">✕</button>
            </div>
            
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 mt-4 border-b border-[#2A2A3A] pb-2">Blast Radius Analysis</h4>
            {loadingRadius && <LoadingPulse text="CALCULATING CASCADE IMPACT..." className="scale-75 origin-left mb-4 opacity-70" />}
            
            {!loadingRadius && fastRadius && fastRadius.paths && (
              <div className="flex flex-col gap-4 mb-8">
                <p className="text-xs text-zinc-500 mb-[-8px]">If this situation escalates:</p>
                {renderRadiusGroup(fastRadius.paths.filter(p => p.joint_confidence > 0.6), '🔴 High Impact', 'text-red-400')}
                {renderRadiusGroup(fastRadius.paths.filter(p => p.joint_confidence > 0.3 && p.joint_confidence <= 0.6), '🟡 Medium Impact', 'text-amber-400')}
                {renderRadiusGroup(fastRadius.paths.filter(p => p.joint_confidence <= 0.3), '🟢 Monitoring', 'text-emerald-400')}

                <Button onClick={() => window.location.href=`/blast-radius?query=${selectedNode.id}`} className="w-full bg-purple-600 hover:bg-purple-500 text-xs mt-1 h-8 tracking-wider font-semibold">
                  RUN FULL LLM ANALYSIS
                </Button>
              </div>
            )}

            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 border-b border-[#2A2A3A] pb-2">Direct Relationships</h4>
            <div className="flex flex-col gap-3">
              {graph.edges
                .filter((e: any) => {
                  const src = e.source ?? e.from;
                  const tgt = e.target ?? e.to;
                  return src === selectedNode.id || tgt === selectedNode.id || src?.id === selectedNode.id || tgt?.id === selectedNode.id;
                })
                .map((e: any, i) => {
                  const srcObj = e.source ?? e.from;
                  const tgtObj = e.target ?? e.to;
                  const isSource = srcObj === selectedNode.id || srcObj?.id === selectedNode.id;
                  const targetLabel = isSource ? (tgtObj?.label || tgtObj?.id || tgtObj) : (srcObj?.label || srcObj?.id || srcObj);
                  return (
                    <div key={i} className="text-xs bg-[#16161F] border border-[#2A2A3A] p-3 rounded-lg relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2 font-mono font-medium text-[10px] tracking-wide text-zinc-300">
                           <span className={isSource ? "text-red-400" : "text-emerald-400"}>
                             {isSource ? 'OUT ➔' : 'IN ←'} 
                           </span>
                           <span className="bg-[#2A2A3A] px-2 py-0.5 rounded">{e.label || e.type}</span>
                         </div>
                      </div>
                      <div className="text-white font-medium text-sm leading-snug mb-3">{targetLabel}</div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between w-full">
                          <span className="text-[10px] text-zinc-500 uppercase">Confidence</span>
                          <span className="text-[10px] text-zinc-400">{(e.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <ConfidenceBar value={e.confidence} height={4} showValue={false} />
                      </div>
                    </div>
                  );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Row 3: Changed & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-shrink-0">
        <div className="col-span-1 rounded-xl border border-[#2A2A3A] bg-[#111118] p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-sm text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            Most Volatile Entities <span>(24h)</span>
          </h3>
          <div className="flex flex-col gap-5 relative opacity-80 pointer-events-none">
             {/* Mock visual for volatility - mapping over top 4 stats from graph roughly */}
             {graph.nodes.slice(0, 4).map((n, i) => (
                <div key={n.id} className="flex flex-col gap-1.5 border-b border-[#2A2A3A] pb-3 last:border-0">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-zinc-200">{n.label}</span>
                    <span className="text-xs text-red-400 font-mono font-bold">-{(Math.random()*40 + 10).toFixed(1)}%</span>
                  </div>
                  <ConfidenceBar value={0.8 - (i * 0.15)} height={3} showValue={false} />
                </div>
             ))}
             <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] bg-[#111118]/50">
               <span className="px-3 py-1 bg-[#2A2A3A] text-zinc-300 text-xs rounded border border-[#3A3A4A] shadow-md">Data populating...</span>
             </div>
          </div>
        </div>

        <div className="col-span-2 rounded-xl border border-[#2A2A3A] bg-[#111118] p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-sm text-zinc-300 uppercase tracking-wider">Recent Priority Alerts</h3>
          <div className="flex flex-col gap-3">
            {alerts.length > 0 ? (
              alerts.map((alert, i) => (
                <motion.div key={alert.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
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
