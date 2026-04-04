import { useEffect, useState } from 'react'
import { useAlertStore } from '@/store/alertStore'
import { fetchAlerts, markAlertRead, markAllRead } from '@/api/alerts'
import { AlertCard } from '@/components/cards/AlertCard'
import { LoadingPulse } from '@/components/shared/LoadingPulse'
import { CheckCheck } from 'lucide-react'
import { IndraLogo } from '@/components/branding/IndraLogo'

export function Alerts() {
  const { alerts, setAlerts, markRead, markAllRead: storeMarkAll } = useAlertStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
      .then(setAlerts)
      .finally(() => setLoading(false))
  }, [setAlerts])

  if (loading) return <LoadingPulse text="LOADING ALERTS..." />

  return (
    <div className="container-fluid py-4 h-100 overflow-y-auto" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-end border-bottom border-secondary pb-4 mb-4">
        <div>
          <h1 className="h3 fw-bold text-white d-flex align-items-center gap-3 mb-2 flex-wrap">
            <IndraLogo height={36} style={{ maxWidth: '5.5rem' }} />
            <span>Priority Alert Center</span>
          </h1>
          <p className="body-3 text-muted mb-0">Monitoring real-time confidence decay across 498 edges</p>
        </div>
        <button
          type="button"
          onClick={async () => { await markAllRead(); storeMarkAll() }}
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
        >
          <CheckCheck size={14} /> Mark all as read
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {alerts.length === 0 ? (
          <div className="body-3 text-muted text-center py-5">No alerts in this window.</div>
        ) : (
          alerts.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              onClick={() => {
                if (!a.read) {
                  markAlertRead(a.id)
                  markRead(a.id)
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}
