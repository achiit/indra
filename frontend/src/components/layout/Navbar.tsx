import { Search, Bell, Menu } from 'lucide-react'
import { useAlertStore } from '@/store/alertStore'
import { IndraLogo } from '@/components/branding/IndraLogo'

export function Navbar() {
  const { unreadCount } = useAlertStore()

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[#2A2A3A] bg-[#0A0A0F]/95 backdrop-blur z-20 sticky top-0">
      
      {/* Mobile menu toggle (placeholder for future) */}
      <button className="md:hidden text-zinc-400 mr-2 shrink-0">
        <Menu size={20} />
      </button>

      <div className="shrink-0 mr-3 md:mr-4 flex items-center">
        <IndraLogo height={30} className="max-w-[7rem] md:max-w-[8rem]" />
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-xl relative min-w-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={16} />
        <input 
          type="text" 
          placeholder="Search entities, events, or type a query... (CMD+K)"
          className="w-full bg-[#16161F] border border-[#2A2A3A] rounded-md pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors placeholder:text-zinc-600"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
          <kbd className="px-1.5 py-0.5 bg-[#2A2A3A] text-zinc-400 rounded text-[10px] font-mono font-medium">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-[#2A2A3A] text-zinc-400 rounded text-[10px] font-mono font-medium">K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <button className="relative text-zinc-400 hover:text-zinc-200">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0A0A0F]" />
          )}
        </button>
      </div>
    </header>
  )
}
