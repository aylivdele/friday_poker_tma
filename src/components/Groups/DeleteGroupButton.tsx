'use client'

import { Button } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { usePlayerStore } from '@/stores/playerStore'
import { ConfirmButton } from '../ConfirmButton/ConfirmButton'

export function DeleteGroupButton({ groupId, ownerId }: { groupId: string, ownerId: string }) {
  const player = usePlayerStore(p => p.player)
  const router = useRouter()
  const [isLoading, setLoading] = useState(false)

  const deleteGroup = async () => {
    if (isLoading) {
      return Promise.resolve()
    }
    setLoading(true)
    return await api.delete(`/api/groups/${groupId}`).then(() => router.replace('/groups')).catch((reason) => {
      console.error(reason)
      toast.error(`Ошибка: ${reason}`)
    }).finally(() => setLoading(false))
  }

  if (player?._id?.toString() === ownerId) {
    return (
      <ConfirmButton description="Вы уверены, что хотите удалить группу?" onConfirm={deleteGroup}>
        <Button stretched size="l" loading={isLoading} disabled={isLoading}>Удалить группу</Button>
      </ConfirmButton>
    )
  }

  return null
}
