import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollText, ArrowLeft, Copy, Check } from 'lucide-react'
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
    <div className="min-vh-100 d-flex flex-column bg-dark text-light">
      <div className="border-bottom border-secondary px-3 py-3 px-md-4 py-md-4 flex-shrink-0" style={{ backgroundColor: 'rgba(17, 17, 24, 0.8)', backdropFilter: 'blur(4px)' }}>
        <div className="container-fluid max-w-100 mx-auto mx-xl-4 d-flex flex-column gap-3 flex-sm-row align-items-sm-center justify-content-sm-between p-0" style={{ maxWidth: '1200px' }}>
          <div className="d-flex align-items-start gap-3">
            <Link
              to="/dashboard"
              className="mt-1 p-2 rounded border border-secondary text-muted text-decoration-none d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '36px', height: '36px' }}
              aria-label="Back to Command Centre"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <ScrollText className="text-info" size={22} />
                <h1 className="h5 fw-bold text-white mb-0">Intelligence briefing</h1>
                <span className="badge border border-danger text-danger bg-transparent font-monospace" style={{ fontSize: '0.65rem' }}>
                  RESTRICTED
                </span>
              </div>
              <p className="body-3 text-muted mt-1 mb-0" style={{ maxWidth: '600px' }}>
                Desk-ready ASCII brief from the live typed graph. Pick a domain, generate, then copy or print.
              </p>
            </div>
          </div>
          <IndraLogo height={40} className="opacity-75 d-none d-sm-block flex-shrink-0" />
        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column py-4 px-3 px-md-4 min-h-0">
        <div className="container-fluid d-flex flex-column flex-grow-1 p-0 mx-auto" style={{ maxWidth: '1200px' }}>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {BRIEF_DOMAINS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setBriefDomain(d.id)}
                className={`btn btn-sm font-monospace text-uppercase ${briefDomain === d.id
                    ? 'btn-info border-info text-dark fw-semibold'
                    : 'btn-outline-secondary text-muted'
                  }`}
                style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3 flex-shrink-0 mb-4">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={briefLoading}
              className="btn btn-info fw-bold text-dark text-uppercase h-100"
              style={{ minWidth: '220px', fontSize: '0.875rem', letterSpacing: '0.05em' }}
            >
              {briefLoading ? 'GENERATING BRIEF…' : 'Generate morning brief'}
            </button>
            {briefText && (
              <button
                type="button"
                onClick={copyBrief}
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center bg-dark text-light"
              >
                {copied ? (
                  <>
                    <Check size={16} className="me-2 text-success" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} className="me-2 text-muted" /> Copy text
                  </>
                )}
              </button>
            )}
            {briefMeta && (
              <span className="text-muted font-monospace ms-sm-auto" style={{ fontSize: '0.75rem' }}>Generated: {briefMeta}</span>
            )}
          </div>

          <div className="flex-grow-1 d-flex flex-column rounded-3 border border-secondary shadow-sm overflow-hidden" style={{ minHeight: 'min(70vh, 720px)', backgroundColor: '#050508' }}>
            {briefLoading && (
              <div className="flex-grow-1 d-flex align-items-center justify-content-center p-5">
                <LoadingPulse text="SYNTHESIZING BRIEF FROM GRAPH…" />
              </div>
            )}
            {!briefLoading && briefText && (
              <div className="flex-grow-1 overflow-auto p-4 p-md-5">
                <pre className="text-info font-monospace" style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, opacity: 0.9 }}>
                  {briefText}
                </pre>
              </div>
            )}
            {!briefLoading && !briefText && (
              <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-5 text-center">
                <p className="text-muted body-2" style={{ maxWidth: '400px' }}>
                  No brief yet. Select a domain above and click <strong className="text-light">Generate morning brief</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
