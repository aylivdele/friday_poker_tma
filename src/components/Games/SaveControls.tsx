// SaveControls.tsx
'use client'

import type { Game } from '@/types/db'
import { Button, Section } from '@telegram-apps/telegram-ui'
import { mainButton } from '@tma.js/sdk-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

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
      await api.post(`/api/games/${gameId}`, draft)
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

  useEffect(() => {
    if (!mainButton)
      return

    mainButton.setText('Сохранить')
    mainButton.show()
    mainButton.onClick(save)

    return () => {
      mainButton.hide()
      mainButton.offClick(save)
    }
  }, [draft])

  return (
    <Section>
      <Button
        size="l"
        stretched
        loading={saving}
        onClick={save}
      >
        Сохранить изменения
      </Button>
    </Section>
  )
}
