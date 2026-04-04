import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { WarRoom } from '@/pages/WarRoom'
import { DomainPanel } from '@/pages/DomainPanel'
import { BlastRadius } from '@/pages/BlastRadius'
import { Alerts } from '@/pages/Alerts'
import { Briefing } from '@/pages/Briefing'
import { PlaceholderView } from '@/pages/PlaceholderView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected layout wraps dashboard */}
        <Route element={<PageLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<WarRoom />} />
          <Route path="/dashboard/:domainId" element={<DomainPanel />} />
          <Route path="/blast-radius" element={<BlastRadius />} />
          <Route path="/briefing" element={<Briefing />} />
          <Route path="/alerts" element={<Alerts />} />
          
          <Route path="/watchlist" element={<PlaceholderView title="Watchlist" />} />
          <Route path="/history" element={<PlaceholderView title="Query History" />} />
          <Route path="/reports" element={<PlaceholderView title="Saved Reports" />} />
          <Route path="/settings" element={<PlaceholderView title="Settings & API Keys" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
