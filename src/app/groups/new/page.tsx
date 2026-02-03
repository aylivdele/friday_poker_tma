'use client'

import type { Group } from '@/types/api'
import { Input, Section } from '@telegram-apps/telegram-ui'
import { mainButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PinModal } from '@/components/Groups/PinModal'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'

export default function NewGroupPage() {
  const [title, setTitle] = useState<string>('')
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    mainButton.setText('Сохранить группу')
    mainButton.show()

    const unbound = mainButton.onClick(() => setModalOpen(true))

    return () => {
      mainButton.hide()
      unbound()
    }
  }, [mainButton, title])

  useEffect(() => {
    if (loading) {
      mainButton.showLoader()
      mainButton.disable()
    }

    return () => {
      mainButton.hideLoader()
      mainButton.enable()
    }
  }, [loading])

  const onPinEnter = (pin: number[]) => {
    setModalOpen(false)
    setLoading(true)
    api.post<Group>(`/api/groups`, { title, pin: pin.join('') })
      .then(group => router.replace(`/group/${group._id}`))
      .catch(e => toast.error(e))
      .finally(() => setLoading(false))
  }

  return (
    <Page>
      <PinModal open={modalOpen} onOpenChange={setModalOpen} onPinEnter={onPinEnter} />

      <Section header="Создание новой группы">
        <Input
          value={title}
          header="Название"
          disabled={loading}
          onChange={e => setTitle(e.target.value)}
          placeholder="Весна 25 г."
        />
      </Section>

    </Page>
  )
}
