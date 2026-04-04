import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollText, ArrowLeft, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateMorningBrief } from '@/api/blastRadius'
import { LoadingPulse } from '@/components/shared/LoadingPulse'
import { IndraLogo } from '@/components/branding/IndraLogo'

const BRIEF_DOMAINS = [
  { id: 'geopolitics', label: 'Geopolitics' },
  { id: 'economics', label: 'Economics' },
  { id: 'defense', label: 'Defense' },
  { id: 'technology', label: 'Technology' },
  { id: 'climate', label: 'Climate' },
  { id: 'society', label: 'Society' },
] as const

export function Briefing() {
  const [briefDomain, setBriefDomain] = useState<string>('geopolitics')
  const [briefText, setBriefText] = useState<string | null>(null)
  const [briefMeta, setBriefMeta] = useState<string | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setBriefLoading(true)
    setBriefText(null)
    setBriefMeta(null)
    setCopied(false)
    try {
      const { briefing, generated_at } = await generateMorningBrief(briefDomain)
      setBriefText(briefing)
      const when = generated_at
        ? `${new Date(generated_at).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'UTC',
          })} UTC`
        : null
      setBriefMeta(when)
    } catch {
      setBriefText(
        '    ╔════════════════════════════════════╗\n    ║   BRIEFING UNAVAILABLE             ║\n    ╚════════════════════════════════════╝'
      )
    } finally {
      setBriefLoading(false)
    }
  }

  const copyBrief = async () => {
    if (!briefText) return
    await navigator.clipboard.writeText(briefText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-full flex flex-col bg-[#0A0A0F] text-[#F4F4F5]">
      <div className="border-b border-[#2A2A3A] bg-[#111118]/80 backdrop-blur-sm px-6 py-5 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <Link
              to="/dashboard"
              className="mt-1 p-2 rounded-lg border border-[#2A2A3A] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors shrink-0"
              aria-label="Back to Command Centre"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <ScrollText className="text-teal-400" size={22} />
                <h1 className="text-xl font-bold tracking-tight text-white">Intelligence briefing</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/40 text-red-400 uppercase tracking-widest">
                  RESTRICTED
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-2 max-w-2xl leading-relaxed">
                Desk-ready ASCII brief from the live typed graph. Pick a domain, generate, then copy or print.
              </p>
            </div>
          </div>
          <IndraLogo height={40} className="opacity-90 hidden sm:block shrink-0" />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-6 md:px-8 md:py-8 min-h-0">
        <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 min-h-0 gap-6">
          <div className="flex flex-wrap gap-2">
            {BRIEF_DOMAINS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setBriefDomain(d.id)}
                className={`text-xs px-3 py-2 rounded-md border font-mono uppercase tracking-wide transition-colors ${
                  briefDomain === d.id
                    ? 'border-teal-500 bg-teal-500/15 text-teal-200'
                    : 'border-[#2A2A3A] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={briefLoading}
              className="w-full sm:w-auto min-w-[220px] bg-teal-700 hover:bg-teal-600 text-white font-bold tracking-wider text-sm h-11"
            >
              {briefLoading ? 'GENERATING BRIEF…' : 'Generate morning brief'}
            </Button>
            {briefText && (
              <Button
                type="button"
                variant="outline"
                onClick={copyBrief}
                className="border-[#2A2A3A] bg-[#16161F] text-zinc-300 hover:bg-[#1f1f2a]"
              >
                {copied ? (
                  <>
                    <Check size={16} className="mr-2 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-2" /> Copy text
                  </>
                )}
              </Button>
            )}
            {briefMeta && (
              <span className="text-xs text-zinc-600 font-mono sm:ml-auto">Generated: {briefMeta}</span>
            )}
          </div>

          <div className="flex-1 min-h-[min(70vh,720px)] rounded-xl border border-[#2A2A3A] bg-[#050508] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden flex flex-col">
            {briefLoading && (
              <div className="flex-1 flex items-center justify-center p-12">
                <LoadingPulse text="SYNTHESIZING BRIEF FROM GRAPH…" />
              </div>
            )}
            {!briefLoading && briefText && (
              <div className="flex-1 overflow-auto p-6 md:p-10">
                <pre className="text-sm md:text-[15px] leading-relaxed text-cyan-100/95 font-mono whitespace-pre-wrap break-words m-0 max-w-none">
                  {briefText}
                </pre>
              </div>
            )}
            {!briefLoading && !briefText && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <p className="text-zinc-500 text-sm max-w-md">
                  No brief yet. Select a domain above and click <strong className="text-zinc-400">Generate morning brief</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
