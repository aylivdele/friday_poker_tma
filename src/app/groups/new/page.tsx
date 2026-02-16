'use client'

import type { Group } from '@/types/api'
import { Input, Section, Subheadline } from '@telegram-apps/telegram-ui'
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
      unbound()
      mainButton.hide()
    }
  }, [mainButton])

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
    api.post<string>(`/api/groups`, { title, pin: pin.join('') })
      .then(groupId => router.replace(`/groups/${groupId}`))
      .catch(e => toast.error(e))
      .finally(() => setLoading(false))
  }

  return (
    <Page>
      <PinModal open={modalOpen} onOpenChange={setModalOpen} onPinEnter={onPinEnter} />

      <Section header="Создание новой группы">
        <Input
          className="input"
          value={title}
          header={<Subheadline>Название</Subheadline>}
          disabled={loading}
          onChange={e => setTitle(e.target.value)}
          placeholder="Пожилые страусы"
        />
      </Section>

    </Page>
  )
}
