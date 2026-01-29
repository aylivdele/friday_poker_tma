'use client'

import { mainButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { isNull } from '@/app/api/helpers'
import { usePlayerStore } from '@/stores/playerStore'

export function NewGameButton({ groupMembers, games, seasonId, groupId }: { groupMembers: string[], games: number, seasonId: string, groupId?: string }) {
  const player = usePlayerStore(s => s.player)
  const router = useRouter()

  const handleSubmit = () => {
    router.push(`/groups/${groupId}/seasons/${seasonId}/games/new`)
  }

  useEffect(() => {
    if (!mainButton || games >= 13 || isNull(player?._id) || !groupMembers.includes(player?._id?.toString()) || isNull(groupId))
      return

    mainButton.setText('Создать новую игру')
    mainButton.show()

    mainButton.onClick(handleSubmit)

    return () => {
      mainButton.hide()
      mainButton.offClick(handleSubmit)
    }
  }, [mainButton, games, player, groupMembers, groupId])

  return null
}
