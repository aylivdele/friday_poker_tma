'use client'

import { Input, Section, Subheadline } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { PinModal } from '@/components/Groups/PinModal'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

export default function NewGroupPage() {
  const [title, setTitle] = useState<string>('')
  const router = useRouter()
  const [pinOpen, setPinOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const onPinEnter = (pin: number[]) => {
    setPinOpen(false)
    setLoading(true)
    api.post<string>(`/api/groups`, { title, pin: pin.join('') })
      .then(groupId => router.replace(`/groups/${groupId}`))
      .catch(e => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  return (
    <Page>
      <Section header="Создание новой группы" footer="PIN из 4 цифр понадобится друзьям, чтобы вступить в группу">
        <Input
          className="input"
          value={title}
          before={<Subheadline>Название</Subheadline>}
          disabled={loading}
          onChange={e => setTitle(e.target.value)}
          placeholder="Пожилые страусы"
        />
      </Section>

      <PinModal open={pinOpen} onOpenChange={setPinOpen} onPinEnter={onPinEnter} label="Придумайте PIN группы" />

      <ActionBar>
        {pinOpen
          ? <ActionButton variant="secondary" onClick={() => setPinOpen(false)}>Отмена</ActionButton>
          : <ActionButton disabled={!title.trim()} loading={loading} onClick={() => setPinOpen(true)}>Далее: задать PIN</ActionButton>}
      </ActionBar>
    </Page>
  )
}
