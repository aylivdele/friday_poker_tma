'use client'

import type { Game } from '@/types/api'
import { Button, Section } from '@telegram-apps/telegram-ui'
import { mainButton } from '@tma.js/sdk-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { ConfirmButton } from '../ConfirmButton/ConfirmButton'

export default function SaveControls({
  gameId,
  draft,
  onSaved,
}: {
  gameId: string
  draft: Game
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await api.put(`/api/games/${gameId}`, draft)
      onSaved()
    }
    catch (e) {
      console.error('Ошибка сохранения настроек игры', e)
      toast.error('Ошибка сохранения')
    }
    finally {
      setSaving(false)
    }
  }

  async function deleteGame() {
    setSaving(true)
    try {
      await api.delete(`/api/games/${gameId}`)
      onSaved()
    }
    catch (e) {
      console.error('Ошибка удаления игры', e)
      toast.error('Ошибка удаления')
    }
    finally {
      setSaving(false)
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

  return (
    <Section>
      <ConfirmButton description="Вы уверены что хотите удалить игру?" onConfirm={deleteGame}>
        <Button
          size="l"
          stretched
          loading={saving}
          color="red"
        >
          Удалить игру
        </Button>
      </ConfirmButton>
    </Section>
  )
}
