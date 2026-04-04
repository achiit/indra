const MOCK_TICKER_MESSAGES = [
  '● GDELT LIVE  |  Pakistan PM meets Chinese ambassador · 2m ago',
  'India defence budget revised upward — 3rd time this quarter · 14m ago',
  'Russia deepens bilateral defence ties with India · 1h ago',
  "NEW NODE ADDED TO GRAPH — 'DRDO WEAPONS FACILITY EXPANSION'",
  'CONFIDENCE SHIFT: MEA issues strong dossier on border incident · 22m ago',
  '● REUTERS  |  China-Pakistan Economic Corridor (CPEC) timeline delayed · 45m ago',
  'Foreign Secretary arrives in Moscow for strategic dialogue · 2h ago',
  "NEW EDGE DETECTED: 'INDIA_RUSSIA_TRADE_AGREEMENT'",
  '● GDELT LIVE  |  LAC patrol activity elevated — cross-referencing satellite data · 8m ago',
]

export function LiveTicker() {
  const messages = MOCK_TICKER_MESSAGES

  return (
    <div className="border-top border-secondary bg-dark text-muted font-monospace small text-uppercase tracking-wide d-flex align-items-center overflow-hidden position-relative z-3" style={{ height: '28px' }}>
      <div className="position-absolute start-0 w-25 h-100 placeholder-glow" style={{ background: 'linear-gradient(to right, #212529, transparent)', zIndex: 10, pointerEvents: 'none' }} />
      <div className="position-absolute end-0 w-25 h-100 placeholder-glow" style={{ background: 'linear-gradient(to left, #212529, transparent)', zIndex: 10, pointerEvents: 'none' }} />

      <div className="d-flex bg-dark text-nowrap animate-ticker">
        {[...messages, ...messages, ...messages].map((msg, idx) => (
          <div key={idx} className="d-flex align-items-center border-end border-secondary px-4 py-1">
            {msg.includes('NEW NODE') || msg.includes('NEW EDGE') || msg.includes('CONFIDENCE SHIFT') ? (
              <span className="text-warning fw-bold">{msg}</span>
            ) : msg.includes('GDELT LIVE') ? (
              <span className="text-primary fw-bold d-flex align-items-center gap-2">
                <span className="badge bg-primary rounded-circle p-1 animate-pulse flex-shrink-0" style={{ width: '6px', height: '6px' }} />
                {msg.replace(/●\s*GDELT LIVE\s*\|\s*/i, '').trim()}
              </span>
            ) : (
              <span>{msg}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
