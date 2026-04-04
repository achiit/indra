import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { runBlastRadius } from '@/api/blastRadius'
import type { BlastRadiusResult } from '@/types/indra'
import { EntityTypeBadge } from '@/components/shared/EntityTypeBadge'
import { LoadingPulse } from '@/components/shared/LoadingPulse'
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph'
import { cn } from '@/lib/utils'
import { IndraLogo } from '@/components/branding/IndraLogo'

export function BlastRadius() {
  const [searchParams] = useSearchParams()
  const seeded = useRef(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BlastRadiusResult | null>(null)

  useEffect(() => {
    const q = searchParams.get('query') || searchParams.get('entity')
    if (!q || seeded.current) return
    seeded.current = true
    const decoded = decodeURIComponent(q).replace(/_/g, ' ')
    setQuery(decoded)
    setLoading(true)
    setResult(null)
    runBlastRadius(decoded)
      .then((res) => setResult(res))
      .catch(() => setResult(null))
      .finally(() => setLoading(false))
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return
    setLoading(true)
    setResult(null)
    const res = await runBlastRadius(query)
    setResult(res)
    setLoading(false)
  }

  // Convert paths into a flat graph for visualization
  const graphData = result ? {
    nodes: Array.from(new Set(result.paths.flatMap(p => p.path))).map(id => {
      const pathItem = result.paths.find(p => p.entity === id)
      return {
        id, label: pathItem ? pathItem.label : id,
        type: pathItem ? pathItem.entity_type : 'UNKNOWN',
        domain: pathItem ? pathItem.domain : 'general'
      }
    }),
    edges: result.paths.flatMap(p => {
      // create chain of edges
      const links = []
      for(let i=0; i<p.path.length-1; i++){
        links.push({
          source: p.path[i], target: p.path[i+1],
          type: 'RELATED_TO', confidence: p.joint_confidence, stale: false
        })
      }
      return links
    })
  } : null

  return (
    <div className="h-full flex flex-col items-center bg-[#0A0A0F] p-6 max-w-[1600px] mx-auto overflow-y-auto">
      
      {/* Hero Header */}
      <div className={cn('w-full flex flex-col items-center', result ? 'mt-4 mb-6' : 'mt-16 mb-10')}>
        <IndraLogo
          height={72}
          className="mb-6 drop-shadow-[0_0_28px_rgba(124,58,237,0.2)]"
        />
        <h1 className="text-3xl font-bold tracking-tight mb-3">Blast Radius Engine</h1>
        <p className="text-zinc-400 max-w-lg text-center text-sm">
          Map causal chain reactions instantly. Enter an entity, policy, or event to visualize how second and third-order effects propagate through the graph.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mt-8 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={loading}
            placeholder="e.g., Pakistan Defaults, TSMC Factory Incident, India Oil Tariffs..."
            className="w-full bg-[#16161F]/80 backdrop-blur-md border border-purple-500/30 rounded-full pl-12 pr-32 py-4 text-base shadow-[0_0_15px_rgba(124,58,237,0.05)] focus:outline-none focus:border-purple-400 focus:shadow-[0_0_30px_rgba(124,58,237,0.2)] transition-all font-medium text-white"
          />
          <Button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white min-w-[100px]"
          >
            {loading ? 'Mapping...' : 'Simulate'}
          </Button>
        </form>
      </div>

      {loading && (
        <div className="flex-1 w-full flex items-center justify-center py-8">
          <LoadingPulse text="MAPPING CAUSAL CHAINS ACROSS 6 DOMAINS..." />
        </div>
      )}

      {/* Results View */}
      {result && !loading && !result.error && (
        <div className="w-full grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Graph Column */}
          <div className="xl:col-span-3 h-[600px] rounded-xl border border-[#2A2A3A] bg-[#111118] overflow-hidden relative shadow-lg">
             <div className="absolute top-4 left-4 z-10 pointers-events-none bg-[#16161F]/80 backdrop-blur p-3 rounded-lg border border-[#2A2A3A]">
              <h3 className="font-semibold text-sm">Causal Subgraph</h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Source: {result.entity_found ?? result.resolved_entity_id}
                {result.traversal_mode === 'incoming' ? ' · upstream (incoming edges)' : ''}
              </p>
            </div>
            {graphData && (
               <KnowledgeGraph data={graphData as any} highlightedNodeId={result.entity_found ?? result.resolved_entity_id} />
            )}
          </div>

          {/* Analysis Column */}
          <div className="xl:col-span-2 flex flex-col gap-6 h-[600px]">
            {/* Impact Summary */}
            <Card className="shrink-0">
              <div className="p-4 flex gap-6 border-b border-[#2A2A3A]">
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Max Depth</div>
                  <div className="text-2xl font-mono text-purple-400">{result.max_depth} Hops</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Total Impacted</div>
                  <div className="text-2xl font-mono text-amber-400">{result.total_affected}</div>
                </div>
              </div>
              <div className="p-4 bg-zinc-900/50">
                <div className="text-xs text-zinc-500 uppercase font-semibold mb-3">LLM Synthesis Assessment</div>
                <div className="prose prose-invert prose-p:text-sm prose-p:leading-relaxed text-zinc-300">
                  {result.synthesis?.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            </Card>

            {/* Path Traces */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
              <h4 className="text-xs text-zinc-500 uppercase font-semibold pl-1">Critical Pathways</h4>
              {result.paths.sort((a,b) => b.joint_confidence - a.joint_confidence).map((path, i) => (
                <div key={i} className="bg-[#16161F] border border-[#2A2A3A] rounded-lg p-3 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{path.label}</span>
                      <EntityTypeBadge type={path.entity_type} />
                    </div>
                    <span className="font-mono text-xs text-amber-400">{Math.round(path.joint_confidence * 100)}% risk</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 font-mono">
                    {path.path_labels.map((lbl, j) => (
                      <span key={j} className="flex items-center gap-1.5 whitespace-nowrap">
                        {j > 0 && <span className="text-purple-500/50">→</span>}
                        <span className={j === path.path_labels.length - 1 ? 'text-zinc-200 bg-[#2A2A3A] px-1.5 rounded' : ''}>{lbl}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error View */}
      {result && !loading && result.error && (
        <div className="w-full max-w-xl mx-auto bg-red-500/10 border border-red-500/30 p-8 rounded-xl flex flex-col items-center justify-center text-center mt-12 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
            <span className="text-xl font-bold">!</span>
          </div>
          <h3 className="text-lg font-bold text-red-200 mb-2">Analysis Failed</h3>
          <p className="text-zinc-300 text-sm leading-relaxed mb-6">{result.error}</p>
          
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="bg-[#111118] border border-[#2A2A3A] rounded-lg p-4 w-full">
              <span className="text-xs text-zinc-500 uppercase font-semibold block mb-2">Did you mean:</span>
              <div className="flex flex-wrap gap-2 justify-center">
                {result.suggestions.map((s, idx) => {
                  const q = typeof s === 'string' ? s : s.id.replace(/_/g, ' ')
                  const label = typeof s === 'string' ? s : `${s.label} (${s.id})`
                  return (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => { setQuery(q); void handleSubmit({ preventDefault: () => {} } as React.FormEvent) }}
                    className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded font-mono text-xs hover:bg-purple-500/40 transition-colors"
                  >
                    {label}
                  </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {result.error.includes('empty') && (
            <div className="text-xs text-amber-400/80 mt-6 bg-amber-400/10 px-4 py-2 rounded">
              Hint: You need to run the ingestion pipeline to populate the graph first! Run <code>python autonomous_pipeline.py bootstrap</code> in the backend.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
