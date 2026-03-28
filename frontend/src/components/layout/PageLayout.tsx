import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { LiveTicker } from './LiveTicker'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

export function PageLayout() {
  const { isAuthenticated, initSession } = useAuthStore()
  const location = useLocation()

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
        [RESTRICTED — ANALYST USE ONLY — INDRA v2]
      </div>
      
      <div className="flex flex-1 min-h-0 bg-[#0A0A0F] text-[#F4F4F5]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-auto bg-[#0A0A0F] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <LiveTicker />
    </div>
  )
}
