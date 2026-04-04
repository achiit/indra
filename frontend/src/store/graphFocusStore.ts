import { create } from 'zustand'

/** Syncs Command Centre graph search with the global navbar (CMD+K) field. */
interface GraphFocusState {
  commandSearch: string
  setCommandSearch: (q: string) => void
}

export const useGraphFocusStore = create<GraphFocusState>((set) => ({
  commandSearch: '',
  setCommandSearch: (q) => set({ commandSearch: q }),
}))
