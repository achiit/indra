import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/indra'
import { fetchMeApi } from '@/api/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User, token: string) => void
  logout: () => void
  initSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => {
        set({ user, token, isAuthenticated: true })
        localStorage.setItem('indra-auth-storage', JSON.stringify({ state: { token }, version: 0 }))
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        localStorage.setItem('indra-auth-storage', JSON.stringify({ state: { token: null }, version: 0 }))
      },
      initSession: async () => {
        try {
          const { token } = get()
          if (!token) return
          const user = await fetchMeApi()
          set({ user, isAuthenticated: true })
        } catch (err) {
          set({ user: null, token: null, isAuthenticated: false })
        }
      }
    }),
    {
      name: 'indra-auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
)
