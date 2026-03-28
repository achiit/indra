import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { loginApi } from '@/api/auth'
import { IndraLogo } from '@/components/branding/IndraLogo'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const { setUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi(email, password)
      setUser(res.user, res.access_token)
      nav('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col md:flex-row overflow-hidden">
      
      {/* Left Area - Branding */}
      <div 
        className="flex-1 relative hidden md:flex items-center justify-center p-12 border-r border-[#2A2A3A] bg-[#0A0A0F] overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/login.png')" }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <motion.div 
          className="absolute inset-0 bg-purple-600/10 blur-[120px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <div className="z-10 flex flex-col items-start max-w-lg">
          <IndraLogo height={88} className="mb-8 drop-shadow-[0_0_24px_rgba(124,58,237,0.25)]" />
          <h1 className="text-5xl font-bold tracking-tight text-white mb-6 uppercase">
            INDRA v2<br/>Intelligence Engine
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Authorized access only. Monitor causal graph reactions, real-time geopolitical decay, and autonomous blast-radius tracking.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-purple-400 border border-purple-500/20 bg-purple-500/10 px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Live Network Secure
          </div>
        </div>
      </div>

      {/* Right Area - Form */}
      <div className="w-full md:w-[600px] flex items-center justify-center p-8 bg-[#111118]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
          className="w-full max-w-sm"
        >
          <div className="mb-10 md:hidden flex items-center gap-4 border-b border-[#2A2A3A] pb-6">
            <IndraLogo height={40} />
          </div>

          <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
          <p className="text-sm text-zinc-500 mb-8">Sign in to your analyst desk.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="analyst@fund.com"
                className="w-full bg-[#16161F] border border-[#2A2A3A] rounded-md px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#16161F] border border-[#2A2A3A] rounded-md px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

            {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded">{error}</div>}

            <Button 
              type="submit" disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-6 mt-4"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-8">
            Don't have an account? <Link to="/signup" className="text-purple-400 hover:text-purple-300 ml-1">Request Access</Link>
          </p>
        </motion.div>
      </div>

    </div>
  )
}
