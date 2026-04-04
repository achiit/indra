import { useEffect, useRef } from 'react'
import { Search, Bell, Menu } from 'lucide-react'
import { useAlertStore } from '@/store/alertStore'
import { IndraLogo } from '@/components/branding/IndraLogo'
import { useGraphFocusStore } from '@/store/graphFocusStore'

export function Navbar() {
  const { unreadCount } = useAlertStore()
  const commandSearch = useGraphFocusStore((s) => s.commandSearch)
  const setCommandSearch = useGraphFocusStore((s) => s.setCommandSearch)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary sticky-top px-3">
      <div className="container-fluid p-0">
        <button className="navbar-toggler d-lg-none border-0 me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#sideMenu" aria-controls="sideMenu" aria-label="Toggle navigation">
          <Menu size={24} />
        </button>

        <a className="navbar-brand d-lg-none d-flex align-items-center" href="#">
          <IndraLogo height={28} />
        </a>

        <div className="d-flex flex-grow-1 mx-2 mx-lg-4 position-relative align-items-center">
          {/* Search Input */}
          <div className="ux4g-search w-100" style={{ maxWidth: '600px' }}>
            <div className="search-wrapper position-relative w-100">
              <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" style={{ zIndex: 10 }}>
                <Search size={16} />
              </span>
              <input
                ref={searchRef}
                type="search"
                placeholder="Search entities, events... (⌘K)"
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                className="search-input form-control bg-dark text-light border-secondary ms-1"
                style={{ paddingLeft: '2.5rem' }}
                aria-label="Search"
              />
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 ms-auto">
          <button type="button" className="btn btn-link text-light position-relative p-0" aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span className="visually-hidden">New alerts</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
