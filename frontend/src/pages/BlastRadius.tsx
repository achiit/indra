import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { runBlastRadius } from '@/api/blastRadius'
import type { BlastRadiusResult } from '@/types/indra'
import { EntityTypeBadge } from '@/components/shared/EntityTypeBadge'
import { LoadingPulse } from '@/components/shared/LoadingPulse'
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph'
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
      for (let i = 0; i < p.path.length - 1; i++) {
        links.push({
          source: p.path[i], target: p.path[i + 1],
          type: 'RELATED_TO', confidence: p.joint_confidence, stale: false
        })
      }
      return links
    })
  } : null

  return (
    <div className="container-fluid h-100 d-flex flex-column align-items-center bg-dark py-4 px-3 px-md-5 overflow-y-auto w-100" style={{ maxWidth: '1600px' }}>

      {/* Hero Header */}
      <div className={`w-100 d-flex flex-column align-items-center ${result ? 'mt-2 mb-4' : 'mt-5 mb-5'}`}>
        <IndraLogo
          height={72}
          className="mb-4"
          style={{ filter: 'drop-shadow(0 0 28px rgba(124,58,237,0.2)' }}
        />
        <h1 className="display-6 fw-bold text-white mb-2 text-center">Blast Radius Engine</h1>
        <p className="body-2 text-muted text-center" style={{ maxWidth: '500px' }}>
          Map causal chain reactions instantly. Enter an entity, policy, or event to visualize how second and third-order effects propagate through the graph.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="w-100 mt-4 position-relative" style={{ maxWidth: '42rem' }}>
          <Search className="position-absolute text-primary" size={20} style={{ left: '1.25rem', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={loading}
            placeholder="e.g., Pakistan Defaults, TSMC Factory Incident..."
            className="form-control rounded-pill bg-dark text-light border-secondary shadow-sm ps-5 pe-5 py-3 fw-medium"
            style={{ paddingLeft: '3rem', paddingRight: '140px', backdropFilter: 'blur(10px)', background: 'rgba(22,22,31,0.8)' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary rounded-pill position-absolute fw-semibold"
            style={{ right: '0.5rem', top: '0.5rem', bottom: '0.5rem', minWidth: '100px' }}
          >
            {loading ? 'Mapping...' : 'Simulate'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex-grow-1 w-100 d-flex align-items-center justify-content-center py-5">
          <LoadingPulse text="MAPPING CAUSAL CHAINS ACROSS 6 DOMAINS..." />
        </div>
      )}

      {/* Results View */}
      {result && !loading && !result.error && (
        <div className="w-100 row gy-4 gx-xl-4 m-0 p-0">
          {/* Graph Column */}
          <div className="col-12 col-xl-7 p-0 pe-xl-2">
            <div className="h-100 rounded-3 border border-secondary bg-dark position-relative shadow overflow-hidden w-100" style={{ minHeight: '600px' }}>
              <div className="position-absolute top-0 start-0 m-3 z-3 p-2 rounded border border-secondary" style={{ backgroundColor: 'rgba(22, 22, 31, 0.8)', pointerEvents: 'none', backdropFilter: 'blur(4px)' }}>
                <h3 className="h6 fw-semibold text-white mb-1">Causal Subgraph</h3>
                <p className="text-muted font-monospace mb-0" style={{ fontSize: '0.75rem' }}>
                  Source: {result.entity_found ?? result.resolved_entity_id}
                  {result.traversal_mode === 'incoming' ? ' · upstream (incoming edges)' : ''}
                </p>
              </div>
              {graphData && (
                <KnowledgeGraph data={graphData as any} highlightedNodeId={result.entity_found ?? result.resolved_entity_id} />
              )}
            </div>
          </div>

          {/* Analysis Column */}
          <div className="col-12 col-xl-5 p-0 ps-xl-2 d-flex flex-column gap-3" style={{ minHeight: '600px' }}>
            {/* Impact Summary */}
            <div className="card bg-dark border-secondary text-white shadow-sm flex-shrink-0 rounded-3">
              <div className="card-body p-0">
                <div className="d-flex gap-4 p-3 border-bottom border-secondary">
                  <div>
                    <div className="text-muted text-uppercase fw-semibold mb-1 tracking-wider" style={{ fontSize: '0.75rem' }}>Max Depth</div>
                    <div className="h4 font-monospace text-primary mb-0">{result.max_depth} Hops</div>
                  </div>
                  <div>
                    <div className="text-muted text-uppercase fw-semibold mb-1 tracking-wider" style={{ fontSize: '0.75rem' }}>Total Impacted</div>
                    <div className="h4 font-monospace text-warning mb-0">{result.total_affected}</div>
                  </div>
                </div>
                <div className="p-3 bg-secondary bg-opacity-10">
                  <div className="text-muted text-uppercase fw-semibold mb-2 tracking-wider" style={{ fontSize: '0.75rem' }}>LLM Synthesis Assessment</div>
                  <div className="body-2 text-light text-opacity-75" style={{ lineHeight: 1.6 }}>
                    {result.synthesis?.split('\n').map((para, i) => (
                      <p key={i} className="mb-2">{para}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Path Traces */}
            <div className="flex-grow-1 overflow-y-auto pe-2 d-flex flex-column gap-2" style={{ scrollbarWidth: 'thin' }}>
              <h4 className="text-muted text-uppercase fw-semibold ps-1 mb-1 tracking-wider" style={{ fontSize: '0.75rem' }}>Critical Pathways</h4>
              {result.paths.sort((a, b) => b.joint_confidence - a.joint_confidence).map((path, i) => (
                <div key={i} className="border border-secondary rounded-3 p-3 transition-colors" style={{ backgroundColor: '#16161F' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="body-2 fw-semibold text-white">{path.label}</span>
                      <EntityTypeBadge type={path.entity_type} />
                    </div>
                    <span className="font-monospace text-warning flex-shrink-0" style={{ fontSize: '0.75rem' }}>{Math.round(path.joint_confidence * 100)}% risk</span>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2 font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                    {path.path_labels.map((lbl, j) => (
                      <span key={j} className="d-flex align-items-center gap-1 text-nowrap">
                        {j > 0 && <span className="text-primary opacity-50 pe-1">→</span>}
                        <span className={j === path.path_labels.length - 1 ? 'text-light bg-secondary px-1 rounded' : ''}>{lbl}</span>
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
        <div className="w-100 mx-auto bg-danger bg-opacity-10 border border-danger border-opacity-25 p-5 rounded-4 d-flex flex-column align-items-center justify-content-center text-center mt-5 shadow" style={{ maxWidth: '600px' }}>
          <div className="rounded-circle bg-danger bg-opacity-25 text-danger d-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px' }}>
            <span className="h4 fw-bold mb-0">!</span>
          </div>
          <h3 className="h5 fw-bold text-danger mb-3">Analysis Failed</h3>
          <p className="text-light mb-4" style={{ fontSize: '0.875rem' }}>{result.error}</p>

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="bg-dark border border-secondary rounded p-3 w-100">
              <span className="text-muted text-uppercase fw-semibold d-block mb-3" style={{ fontSize: '0.75rem' }}>Did you mean:</span>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {result.suggestions.map((s, idx) => {
                  const q = typeof s === 'string' ? s : s.id.replace(/_/g, ' ')
                  const label = typeof s === 'string' ? s : `${s.label} (${s.id})`
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setQuery(q); void handleSubmit({ preventDefault: () => { } } as React.FormEvent) }}
                      className="btn btn-outline-primary btn-sm font-monospace" style={{ fontSize: '0.75rem' }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {result.error.includes('empty') && (
            <div className="mt-4 bg-warning bg-opacity-10 text-warning px-3 py-2 rounded" style={{ fontSize: '0.75rem' }}>
              Hint: You need to run the ingestion pipeline to populate the graph first! Run <code>python autonomous_pipeline.py bootstrap</code> in the backend.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
