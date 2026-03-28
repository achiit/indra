import { create } from 'zustand'
import type { Alert } from '@/types/indra'

interface AlertState {
  alerts: Alert[]
  unreadCount: number
  setAlerts: (alerts: Alert[]) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unreadCount: 0,
  setAlerts: (alerts) => set({ alerts, unreadCount: alerts.filter(a => !a.read).length }),
  markRead: (id) => set(s => {
    const alerts = s.alerts.map(a => a.id === id ? { ...a, read: true } : a)
    return { alerts, unreadCount: alerts.filter(a => !a.read).length }
  }),
  markAllRead: () => set(s => ({
    alerts: s.alerts.map(a => ({ ...a, read: true })),
    unreadCount: 0,
  })),
}))
