import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
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
    <div className="container-fluid min-vh-100 bg-dark d-flex align-items-center justify-content-center p-3 p-md-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="z-1 w-100" style={{ maxWidth: '24rem' }}
      >
        <div className="d-flex justify-content-center mb-5">
          <IndraLogo height={48} />
        </div>
        <div className="card text-light border-secondary shadow-lg" style={{ backgroundColor: 'rgba(17, 17, 24, 0.8)', backdropFilter: 'blur(16px)' }}>
          <div className="card-header border-bottom border-secondary bg-transparent pt-4 pb-3 px-4">
            <h5 className="card-title fw-bold mb-0">Verify Access</h5>
          </div>
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
              <div className="d-flex justify-content-between gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => inputs.current[i] = el}
                    type="text"
                    maxLength={1}
                    value={d}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="form-control bg-dark border-secondary text-center text-white fw-bold font-monospace focus-ring focus-ring-primary transition-colors"
                    style={{ width: '3rem', height: '3.5rem', fontSize: '1.25rem' }}
                  />
                ))}
              </div>
              <p className="body-3 text-center text-muted mb-2">Resend code in <span className="font-monospace text-light opacity-75">0:45</span></p>
              <button type="submit" className="btn btn-primary w-100 fw-semibold py-2" disabled={loading || otp.join('').length < 6}>
                {loading ? 'Verifying...' : 'Verify Access'}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
