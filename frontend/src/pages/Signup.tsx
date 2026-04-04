import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { signupApi } from '@/api/auth'
import { IndraLogo } from '@/components/branding/IndraLogo'

export function Signup() {
  const [name, setName] = useState('')
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
      const res = await signupApi(name, email, password)
      setUser(res.user, res.access_token)
      nav('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column flex-md-row overflow-hidden bg-dark">

      {/* Left Area - Same Branding as Login with varied text */}
      <div
        className="col-md-6 position-relative d-none d-md-flex flex-column justify-content-center p-5 border-end border-secondary bg-dark overflow-hidden"
        style={{ backgroundImage: "url('/login.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="position-absolute w-100 h-100 top-0 start-0 bg-black opacity-50" />
        <motion.div
          className="position-absolute w-100 h-100 top-0 start-0"
          style={{ background: 'rgba(124,58,237,0.1)', filter: 'blur(120px)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <div className="z-1" style={{ maxWidth: '32rem' }}>
          <IndraLogo height={88} className="mb-4" />
          <h1 className="display-4 fw-bold text-white mb-4 text-uppercase">
            Initialize<br />Your Desk
          </h1>
          <p className="lead text-muted mb-5">
            Join the predictive intelligence network. Connect to the real-time geopolitical ontology engine.
          </p>
        </div>
      </div>

      {/* Right Area - Registration Form */}
      <div className="col-12 col-md-6 d-flex align-items-center justify-content-center p-4 bg-dark">
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="w-100" style={{ maxWidth: '24rem' }}
        >
          <div className="mb-5 d-md-none d-flex align-items-center gap-3 border-bottom border-secondary pb-4">
            <IndraLogo height={40} />
          </div>

          <h2 className="h2 text-white mb-2">Request Access</h2>
          <p className="body-2 text-muted mb-4">Create an analyst account to access the graph.</p>

          <form onSubmit={handleSubmit} className="d-flex flex-column needs-validation" noValidate>

            <div className="mb-3">
              <label htmlFor="signupName" className="form-label label-3 text-muted text-uppercase tracking-wider">Full Name</label>
              <input
                id="signupName"
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                className="form-control bg-dark text-light border-secondary py-2"
                aria-required="true"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="signupEmail" className="form-label label-3 text-muted text-uppercase tracking-wider">Email Address</label>
              <input
                id="signupEmail"
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="jane@fund.com"
                className="form-control bg-dark text-light border-secondary py-2"
                aria-required="true"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="signupPass" className="form-label label-3 text-muted text-uppercase tracking-wider">Secure Password</label>
              <input
                id="signupPass"
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-control bg-dark text-light border-secondary py-2"
                aria-required="true"
              />
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 text-sm mb-3" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="btn btn-primary w-100 py-2 mt-2 fw-semibold"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registering...
                </>
              ) : 'Complete Setup'}
            </button>
          </form>

          <p className="text-center body-2 text-muted mt-4">
            Already authorized? <Link to="/login" className="text-primary ms-1 text-decoration-none">Sign In</Link>
          </p>
        </motion.div>
      </div>

    </div>
  )
}
