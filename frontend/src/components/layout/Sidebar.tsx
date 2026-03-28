import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Globe, TrendingUp, Shield, Cpu, Leaf, Users, Zap, Bell, Bookmark, Clock, FileText, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAlertStore } from '@/store/alertStore'
import { IndraLogo } from '@/components/branding/IndraLogo'

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useAlertStore()
  const nav = useNavigate()

  const links = [
    { to: '/dashboard',            icon: LayoutDashboard, label: 'Command Centre' },
    { to: '/dashboard/geopolitics',icon: Globe,           label: 'Geopolitics' },
    { to: '/dashboard/economics',  icon: TrendingUp,      label: 'Economics' },
    { to: '/dashboard/defense',    icon: Shield,          label: 'Defense' },
    { to: '/dashboard/technology', icon: Cpu,             label: 'Technology' },
    { to: '/dashboard/climate',    icon: Leaf,            label: 'Climate' },
    { to: '/dashboard/society',    icon: Users,           label: 'Society' },
    { divider: true },
    { to: '/blast-radius',         icon: Zap,             label: 'Blast Radius', highlight: true },
    { to: '/alerts',               icon: Bell,            label: 'Alerts', badge: unreadCount },
    { to: '/watchlist',            icon: Bookmark,        label: 'Watchlist' },
    { to: '/history',              icon: Clock,           label: 'History' },
    { to: '/reports',              icon: FileText,        label: 'Reports' },
    { divider: true },
    { to: '/settings',             icon: Settings,        label: 'Settings' },
  ]

  return (
    <div className="w-64 bg-[#0A0A0F] border-r border-[#2A2A3A] flex flex-col h-screen shrink-0 text-sm">
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-[#2A2A3A]">
        <NavLink to="/dashboard" className="flex items-center min-w-0 hover:opacity-90 transition-opacity">
          <IndraLogo height={34} className="max-w-[9.5rem]" />
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {links.map((link, i) => {
          if (link.divider) {
            return <div key={`div-${i}`} className="my-2 h-px bg-[#2A2A3A] mx-3" />
          }
          const Icon = link.icon!
          return (
            <NavLink
              key={link.to}
              to={link.to!}
              end={link.to === '/dashboard'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-md transition-all
                ${isActive 
                  ? 'bg-purple-900/20 text-purple-300 before:absolute before:left-0 before:w-1 before:h-6 before:bg-purple-500 before:rounded-r-full' 
                  : (link.highlight ? 'text-amber-400 hover:bg-white/5 hover:text-amber-300' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200')}
              `}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1 truncate">{link.label}</span>
              {!!link.badge && link.badge > 0 && (
                <span className="bg-red-500/20 text-red-400 font-mono text-[10px] px-1.5 py-0.5 rounded min-w-[20px] text-center border border-red-500/30">
                  {link.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Profile */}
      <div className="p-4 border-t border-[#2A2A3A] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-semibold border border-purple-500/30">
          {user?.name.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-medium text-zinc-200">{user?.name}</div>
          <div className="truncate text-[10px] text-zinc-500 uppercase tracking-wider">{user?.plan} PLAN</div>
        </div>
        <button 
          onClick={() => { logout(); nav('/login') }}
          className="text-zinc-500 hover:text-zinc-300 p-1"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
