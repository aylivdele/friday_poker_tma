'use client'

import { Button } from '@telegram-apps/telegram-ui'
import { secondaryButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { usePlayerStore } from '@/stores/playerStore'
import { ConfirmButton } from '../ConfirmButton/ConfirmButton'
import { confirmPopup } from './../ConfirmButton/ConfirmButton'

export function BottomGroupButton({ groupId, ownerId, members }: { groupId: string, ownerId: string, members: string[] }) {
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

  const leaveGroup = async () => {
    if (isLoading) {
      return Promise.resolve()
    }
    setLoading(true)
    return await api.put(`/api/groups/${groupId}/leave`).then(() => router.replace('/groups')).catch((reason) => {
      console.error(reason)
      toast.error(`Ошибка: ${reason}`)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!player || !members.includes(player._id)) {
      return
    }
    let unbound
    if (player?._id?.toString() === ownerId) {
      unbound = secondaryButton.onClick(() => confirmPopup({ onConfirm: deleteGroup, description: 'Вы уверены что хотите удалить группу?' }))
      secondaryButton.setText('Удалить группу')
    }
    else {
      unbound = secondaryButton.onClick(() => confirmPopup({ onConfirm: leaveGroup, description: 'Вы уверены что хотите покинуть группу?' }))
      secondaryButton.setText('Покинуть группу')
    }
    secondaryButton.show()
    secondaryButton.setBgColor('#FF0000')

    return () => {
      unbound()
      secondaryButton.hide()
    }
  }, [player, members, groupId, ownerId])

  return null
}
