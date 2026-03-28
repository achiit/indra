import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { IndraLogo } from '@/components/branding/IndraLogo'

export function Verify() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const nav = useNavigate()
  const { initMock } = useAuthStore()

  useEffect(() => { inputs.current[0]?.focus() }, [])

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const newOtp = [...otp]
    newOtp[i] = val
    setOtp(newOtp)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      initMock()
      nav('/dashboard') // transitions handled by PageLayout
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="z-10 w-full max-w-sm"
      >
        <div className="flex justify-center mb-6">
          <IndraLogo height={48} />
        </div>
        <Card className="backdrop-blur-xl bg-[#111118]/80 border-[#2A2A3A]">
          <CardHeader>
            <CardTitle className="text-xl">Verify OTP</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex justify-between gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => inputs.current[i] = el}
                    type="text"
                    maxLength={1}
                    value={d}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 bg-[#16161F] border border-[#2A2A3A] rounded-md text-center text-xl font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                ))}
              </div>
              <p className="text-xs text-center text-zinc-500">Resend code in <span className="font-mono text-zinc-400">0:45</span></p>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold" disabled={loading || otp.join('').length < 6}>
                {loading ? 'Verifying...' : 'Verify Access'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
