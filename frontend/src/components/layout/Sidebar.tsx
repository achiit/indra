import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Globe, TrendingUp, Shield, Cpu, Leaf, Users, Zap, ScrollText, Bell, Bookmark, Clock, FileText, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAlertStore } from '@/store/alertStore'
import { IndraLogo } from '@/components/branding/IndraLogo'

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useAlertStore()
  const nav = useNavigate()

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Command Centre' },
    { to: '/dashboard/geopolitics', icon: Globe, label: 'Geopolitics' },
    { to: '/dashboard/economics', icon: TrendingUp, label: 'Economics' },
    { to: '/dashboard/defense', icon: Shield, label: 'Defense' },
    { to: '/dashboard/technology', icon: Cpu, label: 'Technology' },
    { to: '/dashboard/climate', icon: Leaf, label: 'Climate' },
    { to: '/dashboard/society', icon: Users, label: 'Society' },
    { divider: true },
    { to: '/blast-radius', icon: Zap, label: 'Blast Radius', highlight: true },
    { to: '/briefing', icon: ScrollText, label: 'Morning Brief' },
    { to: '/alerts', icon: Bell, label: 'Alerts', badge: unreadCount },
    { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { divider: true },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <>
      <div className="d-none d-lg-flex align-items-center px-4 py-3 border-bottom border-secondary" style={{ height: '64px' }}>
        <NavLink to="/dashboard" className="text-decoration-none">
          <IndraLogo height={34} style={{ maxWidth: '9.5rem' }} />
        </NavLink>
      </div>

      <nav className="flex-grow-1 overflow-auto py-3 px-2 d-flex flex-column gap-1" role="navigation" aria-label="Main Navigation">
        {links.map((link, i) => {
          if (link.divider) {
            return <hr key={`div-${i}`} className="text-secondary mx-3 my-2 opacity-25 border-top" />
          }
          const Icon = link.icon!
          return (
            <NavLink
              key={link.to}
              to={link.to!}
              end={link.to === '/dashboard'}
              className={({ isActive }) => `
                d-flex align-items-center gap-3 px-3 py-2 rounded text-decoration-none focus-ring
                ${isActive
                  ? 'bg-primary text-white fw-bold'
                  : (link.highlight ? 'text-warning' : 'text-light')}
              `}
              onClick={() => {
                const offcanvasEl = document.getElementById('sideMenu');
                if (offcanvasEl && offcanvasEl.classList.contains('show')) {
                  // @ts-ignore
                  if (window.ux4g) {
                    // @ts-ignore
                    const bsOffcanvas = window.ux4g.Offcanvas.getInstance(offcanvasEl);
                    bsOffcanvas?.hide();
                  }
                }
              }}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-grow-1 text-truncate">{link.label}</span>
              {!!link.badge && link.badge > 0 && (
                <span className="badge bg-danger rounded-pill px-2">
                  {link.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3 border-top border-secondary d-flex align-items-center gap-3">
        <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold border border-secondary" style={{ width: '32px', height: '32px' }}>
          {user?.name.charAt(0) || 'U'}
        </div>
        <div className="flex-grow-1 w-50">
          <div className="text-truncate body-2 fw-medium mb-0">{user?.name}</div>
          <div className="text-truncate label-3 text-muted text-uppercase">{user?.plan} PLAN</div>
        </div>
        <button
          type="button"
          onClick={() => { logout(); nav('/login') }}
          className="btn btn-link text-muted p-1 focus-ring"
          aria-label="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </>
  )
}
