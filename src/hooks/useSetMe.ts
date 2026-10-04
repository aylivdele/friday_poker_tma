import type { Me } from '@/types/api'
import { useCallback } from 'react'
import { isAppearance } from '@/lib/appearance'
import { useAppearanceStore } from '@/stores/appearanceStore'
import { usePlayerStore } from '@/stores/playerStore'

// Сохраняет загруженный профиль и применяет его оформление: выбор из аккаунта важнее сохранённого на устройстве
export function useSetMe() {
  const setPlayer = usePlayerStore(s => s.setPlayer)
  const setAppearance = useAppearanceStore(s => s.setAppearance)

  return useCallback((me: Me) => {
    setPlayer(me)
    if (isAppearance(me.appearance)) {
      setAppearance(me.appearance)
    }
  }, [setPlayer, setAppearance])
}
