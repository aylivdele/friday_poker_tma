import type { Player } from '@/types/types'
import { create } from 'zustand'

interface PlayerState {
  player?: Player
  setPlayer: (p: Player) => void
}

export const usePlayerStore = create<PlayerState>(set => ({
  player: undefined,
  setPlayer: player => set({ player }),
}))
