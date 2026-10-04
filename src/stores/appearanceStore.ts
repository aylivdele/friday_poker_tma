import type { Appearance, ResolvedAppearance } from '@/lib/appearance'
import { create } from 'zustand'
import { defaultAppearance, readStoredAppearance, storeAppearance } from '@/lib/appearance'
import { isTelegram } from '@/lib/platform'

interface AppearanceState {
  // выбор пользователя
  appearance: Appearance
  // что применено сейчас (с учётом системы и Telegram)
  resolved: ResolvedAppearance
  setAppearance: (appearance: Appearance) => void
  setResolved: (resolved: ResolvedAppearance) => void
}

export const useAppearanceStore = create<AppearanceState>(set => ({
  appearance: typeof window === 'undefined' ? defaultAppearance(false) : (readStoredAppearance() ?? defaultAppearance(isTelegram())),
  resolved: { theme: 'felt', dark: false },
  setAppearance: (appearance) => {
    storeAppearance(appearance)
    set({ appearance })
  },
  setResolved: resolved => set({ resolved }),
}))
