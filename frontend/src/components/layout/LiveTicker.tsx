const MOCK_TICKER_MESSAGES = [
  '● GDELT LIVE  |  Pakistan PM meets Chinese ambassador · 2m ago',
  'India defence budget revised upward · 14m ago',
  'Sri Lanka IMF tranche approved · 1h ago',
  "NEW NODE ADDED TO GRAPH — 'TSMC FACILITY EXPANSION'",
  'CONFIDENCE SHIFT: Taiwan semiconductor supplies dropped 12% · 22m ago',
  '● REUTERS  |  European tech sanctions on Russia tightened · 45m ago',
  'US Federal Reserve signals moderate rate path · 2h ago',
  "NEW EDGE DETECTED: 'INDIA_RUSSIA_TRADE_AGREEMENT'",
  '● GDELT LIVE  |  LAC patrol activity elevated · 8m ago',
  'IMF staff concludes Pakistan review · 3h ago',
]

export function LiveTicker() {
  const messages = MOCK_TICKER_MESSAGES

  return (
    <div className="h-7 w-full border-t border-[#2A2A3A] bg-[#05050A] text-zinc-400 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest flex items-center overflow-hidden flex-shrink-0 relative z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-[#05050A] to-transparent z-10 pointers-events-none" />
      <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-[#05050A] to-transparent z-10 pointers-events-none" />
      
      <div className="flex bg-[#05050A] whitespace-nowrap animate-ticker group">
        {[...messages, ...messages, ...messages].map((msg, idx) => (
          <div key={idx} className="flex flex-row items-center border-r border-[#2A2A3A] px-6 py-0.5">
            {msg.includes('NEW NODE') || msg.includes('NEW EDGE') || msg.includes('CONFIDENCE SHIFT') ? (
              <span className="text-amber-400 font-bold">{msg}</span>
            ) : msg.includes('GDELT LIVE') ? (
              <span className="text-purple-400 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shrink-0" />
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
