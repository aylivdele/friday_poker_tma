'use client'

import type { Game } from '@/types/api'
import { mainButton, secondaryButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { confirmPopup } from '../ConfirmButton/ConfirmButton'

export default function SaveControls({
  gameId,
  draft,
  onSaved,
}: {
  gameId: string
  draft: Game
  onSaved: () => void
}) {
  const router = useRouter()

  async function save() {
    try {
      await api.put(`/api/games/${gameId}`, draft)
      onSaved()
    }
    catch (e) {
      console.error('Ошибка сохранения настроек игры', e)
      toast.error('Ошибка сохранения')
    }
  }

  async function finishGame() {
    try {
      await api.put(`/api/games/${gameId}`, { ...draft, isFinished: true })
      onSaved()
    }
    catch (e) {
      console.error('Ошибка сохранения настроек игры', e)
      toast.error('Ошибка сохранения')
    }
  }

  async function deleteGame() {
    try {
      await api.delete(`/api/games/${gameId}`)
      router.back()
    }
    catch (e) {
      console.error('Ошибка удаления игры', e)
      toast.error('Ошибка удаления')
    }
  }

  useEffect(() => {
    if (!mainButton)
      return

    mainButton.setText('Сохранить')
    mainButton.show()
    const unbound = mainButton.onClick(save)

    return () => {
      mainButton.hide()
      unbound()
    }
  }, [draft])

  useEffect(() => {
    if (!secondaryButton)
      return

    let unbound
    if (draft.isFinished) {
      secondaryButton.setText('Удалить игру')
      secondaryButton.setBgColor('#FF0000')
      unbound = secondaryButton.onClick(() => confirmPopup({ description: 'Вы уверены, что хотите удалить игру?', onConfirm: deleteGame }))
    }
    else {
      secondaryButton.setText('Завершить игру')
      secondaryButton.setBgColor('#00d400')
      unbound = secondaryButton.onClick(() => confirmPopup({ description: 'Вы уверены, что хотите завершить игру?', onConfirm: finishGame }))
    }

    secondaryButton.show()

    return () => {
      secondaryButton.hide()
      unbound()
    }
  }, [draft])

  return null
}
