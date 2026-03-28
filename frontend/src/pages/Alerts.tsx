import { useEffect } from 'react'
import { useAlertStore } from '@/store/alertStore'
import { fetchAlerts, markAlertRead, markAllRead } from '@/api/alerts'
import { AlertCard } from '@/components/cards/AlertCard'
import { LoadingPulse } from '@/components/shared/LoadingPulse'
import { CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IndraLogo } from '@/components/branding/IndraLogo'

export function Alerts() {
  const { alerts, setAlerts, markRead, markAllRead: storeMarkAll } = useAlertStore()

  useEffect(() => {
    fetchAlerts().then(setAlerts)
  }, [setAlerts])

  if (!alerts.length) return <LoadingPulse text="LOADING ALERTS..." />

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end border-b border-[#2A2A3A] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-3 flex-wrap">
            <IndraLogo height={36} className="max-w-[5.5rem]" />
            <span>Priority Alert Center</span>
          </h1>
          <p className="text-sm text-zinc-400">Monitoring real-time confidence decay across 498 edges</p>
        </div>
        <Button 
          variant="outline" 
          onClick={async () => { await markAllRead(); storeMarkAll() }}
          className="text-xs bg-[#111118] border-[#2A2A3A] hover:bg-[#2A2A3A]"
        >
          <CheckCheck size={14} className="mr-2" /> Mark all as read
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {alerts.map(a => (
          <AlertCard 
            key={a.id} 
            alert={a} 
            onClick={() => {
              if(!a.read) {
                markAlertRead(a.id)
                markRead(a.id)
              }
            }} 
          />
        ))}
      </div>
    </div>
  )
}
