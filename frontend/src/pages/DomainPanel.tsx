import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    <div className="h-full flex flex-col pt-6 px-6 max-w-[1600px] mx-auto gap-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-end border-b border-[#2A2A3A] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-3 flex-wrap">
            <IndraLogo height={34} className="max-w-[5rem]" />
            <span>{DOMAIN_LABELS[domainId || ''] || 'Domain Intelligence'}</span>
          </h1>
          <p className="text-sm text-zinc-400 capitalize flex items-center gap-2">
            <span>{graph.total_nodes} Tracked Entities</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span>{graph.total_edges} Verified Edges</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span className="text-purple-400">Live Sync Active</span>
          </p>
        </div>
      </div>

      {/* Main Content Area - Split Map & QnA */}
      <div className="flex-1 min-h-0 flex gap-6 pb-6 w-full">
        {/* Graph Left 65% */}
        <div className="flex-[2] min-h-0 rounded-xl border border-[#2A2A3A] bg-[#111118] overflow-hidden relative shadow-lg">
          <KnowledgeGraph data={graph} />
        </div>

        {/* NLP Query Right 35% */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-[300px]">
          <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-5 shrink-0 shadow-lg">
            <h3 className="font-semibold text-sm text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={16} className="text-purple-400" /> Executive Briefing
            </h3>
            <Button 
              onClick={handleGenerateBrief} 
              disabled={loading} 
              className="w-full bg-purple-600 hover:bg-purple-500 font-bold tracking-wider"
              size="lg"
            >
              {loading ? 'GENERATING...' : 'GENERATE RESTRICTED BRIEF'}
            </Button>
            <p className="text-xs text-zinc-500 mt-3 text-center">
              Compiles top confidence events into a highly-readable intelligence summary.
            </p>
          </div>

          <Card className="flex-1 overflow-y-auto bg-[#16161F] border border-[#2A2A3A]">
            <div className="p-5 flex flex-col h-full">
              <div className="flex-1 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono mt-2 flex flex-col">
                {loading && (
                  <div className="m-auto flex flex-col items-center opacity-70">
                    <LoadingPulse text="SYNTHESIZING CAUSAL GRAPH..." className="scale-75 mb-4" />
                    <span className="text-xs text-zinc-500 animate-pulse">Running LLM Evaluation...</span>
                  </div>
                )}
                {!loading && answer && <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-purple-200">{answer}</div>}
                {!loading && !answer && (
                  <div className="text-zinc-600 italic m-auto text-center px-4 font-sans text-sm">
                    Click "Generate Restricted Brief" to receive your intelligence drop.
                  </div>
                )}
              </div>
               {answer && (
                <div className="text-[10px] text-zinc-500 mt-6 pt-4 border-t border-[#2A2A3A] font-mono shrink-0">
                  CLASSIFICATION: SECRET // NOFORN<br/>
                  TRACE ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
