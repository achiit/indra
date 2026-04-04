import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { LiveTicker } from './LiveTicker'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

export function PageLayout() {
  const { isAuthenticated, initSession } = useAuthStore()

  useEffect(() => {
    // If not authenticated, verify token existence with API
    if (!isAuthenticated) {
      initSession()
    }
  }, [isAuthenticated, initSession])

  if (!isAuthenticated && import.meta.env.VITE_USE_MOCK !== 'true') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="d-flex flex-column vh-100 overflow-hidden bg-dark text-light">
      {/* RESTRICTED SECURITY BANNER */}
      <div className="w-100 text-bg-danger d-flex align-items-center justify-content-between px-3 py-1 font-monospace" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>
        <div>
          <span className="fw-bold tracking-wider me-3">[RESTRICTED — ANALYST USE ONLY — INDRA v1.0]</span>
          <span className="d-inline-flex align-items-center gap-2">
            <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="bg-white rounded-circle" style={{ width: '6px', height: '6px' }} />
            <span className="fw-bold">LIVE</span> • Last sync: 2 min ago
          </span>
        </div>
        <div className="d-none d-lg-flex align-items-center gap-3 opacity-75">
          <span>📄 847 documents indexed</span>
          <span>🌐 GDELT live</span>
          <span>📊 World Bank synced</span>
        </div>
      </div>

      <div className="container-fluid flex-grow-1 p-0 overflow-hidden d-flex">

        {/* Desktop Sidebar */}
        <div className="d-none d-lg-flex flex-column border-end border-secondary bg-dark flex-shrink-0" style={{ width: '250px' }}>
          <Sidebar />
        </div>

        {/* Mobile Sidebar (Offcanvas) */}
        <div className="offcanvas offcanvas-start bg-dark text-white border-end border-secondary" tabIndex={-1} id="sideMenu" aria-labelledby="sideMenuLabel" style={{ width: '250px' }}>
          <div className="offcanvas-header border-bottom border-secondary">
            <h5 className="offcanvas-title m-0" id="sideMenuLabel">Menu</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body p-0 d-flex flex-column h-100">
            <Sidebar />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow-1 d-flex flex-column min-vw-0">
          <header role="banner">
            <Navbar />
          </header>
          <main id="main-content" role="main" className="flex-grow-1 overflow-auto bg-dark p-0 position-relative">
            <div className="h-100 w-100">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <footer role="contentinfo">
        <LiveTicker />
      </footer>
    </div>
  )
}
