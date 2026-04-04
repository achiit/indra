import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { generateMorningBrief } from '@/api/blastRadius'
import { fetchGraph } from '@/api/graph'
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph'
import { LoadingPulse } from '@/components/shared/LoadingPulse'
import type { GraphData } from '@/types/indra'
import { IndraLogo } from '@/components/branding/IndraLogo'

const DOMAIN_LABELS: Record<string, string> = {
  geopolitics: 'Geopolitical Intelligence',
  economics: 'Economic Warfare & Trade',
  defense: 'Defense & Military Posture',
  technology: 'Tech & Cyber Sovereignty',
  climate: 'Climate & Resource Scarcity',
  society: 'Social Cohesion & Unrest',
}

export function DomainPanel() {
  const { domainId } = useParams<{ domainId: string }>()
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)

  useEffect(() => {
    setGraph(null)
    if (domainId) {
      fetchGraph(domainId).then(setGraph)
    }
  }, [domainId])

  const handleGenerateBrief = async () => {
    setLoading(true)
    setAnswer(null)
    try {
      const { briefing } = await generateMorningBrief(domainId || 'general')
      setAnswer(briefing)
    } catch (e: any) {
      setAnswer("ERROR: Could not generate briefing. Ensure LLM provider is active.")
    } finally {
      setLoading(false)
    }
  }

  if (!graph) return <LoadingPulse text={`LOADING ${domainId?.toUpperCase()} DOMAIN...`} />

  return (
    <div className="h-100 d-flex flex-column pt-4 px-3 px-md-4 max-w-100 mx-auto gap-4 overflow-hidden" style={{ maxWidth: '1600px' }}>

      {/* Header */}
      <div className="flex-shrink-0 d-flex justify-content-between align-items-end border-bottom border-secondary pb-3">
        <div>
          <h1 className="h4 fw-bold text-white mb-2 d-flex align-items-center gap-3 flex-wrap tracking-tight">
            <IndraLogo height={34} style={{ maxWidth: '5rem' }} />
            <span>{DOMAIN_LABELS[domainId || ''] || 'Domain Intelligence'}</span>
          </h1>
          <p className="body-3 text-muted text-capitalize d-flex align-items-center gap-2 mb-0">
            <span>{graph.total_nodes} Tracked Entities</span>
            <span className="rounded-circle bg-secondary d-inline-block" style={{ width: '4px', height: '4px' }} />
            <span>{graph.total_edges} Verified Edges</span>
            <span className="rounded-circle bg-secondary d-inline-block" style={{ width: '4px', height: '4px' }} />
            <span className="text-primary font-monospace fw-semibold" style={{ fontSize: '0.75rem' }}>Live Sync Active</span>
          </p>
        </div>
      </div>

      {/* Main Content Area - Split Map & QnA */}
      <div className="flex-grow-1 min-h-0 row gy-4 gx-xl-4 pb-4 w-100 m-0">
        {/* Graph Left 65% */}
        <div className="col-12 col-xl-8 p-0 pe-xl-2 d-flex flex-column min-h-0">
          <div className="flex-grow-1 rounded-3 border border-secondary bg-dark overflow-hidden position-relative shadow-sm w-100 h-100 min-h-0">
            <KnowledgeGraph data={graph} />
          </div>
        </div>

        {/* NLP Query Right 35% */}
        <div className="col-12 col-xl-4 p-0 ps-xl-2 d-flex flex-column gap-4 min-h-0 min-w-0" style={{ minWidth: '300px' }}>
          <div className="bg-dark border border-secondary rounded-3 p-4 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#111118' }}>
            <h3 className="h6 fw-bold text-light text-uppercase tracking-wider mb-4 d-flex align-items-center gap-2" style={{ fontSize: '0.875rem' }}>
              <FileText size={16} className="text-primary" /> Executive Briefing
            </h3>
            <button
              onClick={handleGenerateBrief}
              disabled={loading}
              className="btn btn-primary w-100 fw-bold tracking-wider py-2"
              style={{ fontSize: '0.875rem' }}
            >
              {loading ? 'GENERATING...' : 'GENERATE RESTRICTED BRIEF'}
            </button>
            <p className="body-3 text-muted mt-3 text-center mb-0">
              Compiles top confidence events into a highly-readable intelligence summary.
            </p>
          </div>

          <div className="card flex-grow-1 overflow-y-auto bg-dark border-secondary rounded-3" style={{ backgroundColor: '#16161F' }}>
            <div className="card-body p-4 d-flex flex-column h-100">
              <div className="flex-grow-1 text-light body-2 whitespace-pre-wrap font-monospace mt-2 d-flex flex-column" style={{ lineHeight: 1.6, fontSize: '0.875rem' }}>
                {loading && (
                  <div className="m-auto d-flex flex-column align-items-center opacity-75">
                    <LoadingPulse text="SYNTHESIZING CAUSAL GRAPH..." className="mb-3" />
                    <span className="text-muted font-monospace animate-pulse" style={{ fontSize: '0.75rem' }}>Running LLM Evaluation...</span>
                  </div>
                )}
                {!loading && answer && <div className="text-primary opacity-75 fade-in">{answer}</div>}
                {!loading && !answer && (
                  <div className="text-muted font-italic m-auto text-center px-3 body-2">
                    Click "Generate Restricted Brief" to receive your intelligence drop.
                  </div>
                )}
              </div>
              {answer && (
                <div className="text-muted mt-4 pt-3 border-top border-secondary font-monospace flex-shrink-0" style={{ fontSize: '0.625rem' }}>
                  CLASSIFICATION: SECRET // NOFORN<br />
                  TRACE ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
