import type { Achievment } from '@/types/api'
import { getAchievmentsInfo, getAchievmentsRarity } from '@/lib/achievments'
import { route } from '@/server/http'

// Описания всех достижений и насколько каждое редкое
export const GET = route(async (): Promise<Omit<Achievment, 'progress'>[]> => {
  const rarity = await getAchievmentsRarity()
  return getAchievmentsInfo().map(a => ({ ...a, earnedShare: rarity[a.id] ?? 0 }))
})
