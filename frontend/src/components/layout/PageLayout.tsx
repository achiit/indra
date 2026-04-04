import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { LiveTicker } from './LiveTicker'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'

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
    <div className="flex flex-col h-screen overflow-hidden selection:bg-purple-500/30">
      {/* RESTRICTED SECURITY BANNER */}
      <div className="w-full bg-red-900/40 text-red-500 font-mono text-[10px] text-center pb-0.5 pt-1 border-b border-red-500/20 tracking-[0.2em] uppercase shrink-0 z-50 shadow-md">
        [RESTRICTED — ANALYST USE ONLY — INDRA v1.0]
      </div>
      
      <div className="flex flex-1 min-h-0 bg-[#0A0A0F] text-[#F4F4F5]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-auto bg-[#0A0A0F] relative min-h-0">
            {/* No route transition animation — pages mount at full opacity for instant tab switches */}
            <div className="h-full min-h-full w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <LiveTicker />
    </div>
  )
}
