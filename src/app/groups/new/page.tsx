'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ActionBar, ActionButton, ActionHint } from '@/components/ActionBar/ActionBar'
import { Section } from '@/components/app/Section'
import { Page } from '@/components/Page'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

export default function NewGroupPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)

  const missing = !title.trim() ? 'Укажите название группы' : pin.length !== 4 ? 'Придумайте PIN из 4 цифр' : null

  const create = async () => {
    setSaving(true)
    try {
      const groupId = await api.post<string>('/api/groups', { title: title.trim(), pin })
      toast.success('Группа создана')
      router.replace(`/groups/${groupId}`)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <Page title="Новая группа">
      <Section>
        <label className="flex min-h-14 items-center gap-3 px-3.5 py-2">
          <span className="w-24 shrink-0 text-base">Название</span>
          <Input className="h-10 flex-1 rounded-lg text-base" maxLength={80} placeholder="Пожилые страусы" value={title} disabled={saving} onChange={e => setTitle(e.target.value)} />
        </label>
      </Section>

      <Section
        title="PIN для вступления"
        footer="Сообщите PIN друзьям — с ним они вступят в группу. Посмотреть и поменять его можно в меню группы."
        cardClassName="flex justify-center py-4"
      >
        <InputOTP maxLength={4} inputMode="numeric" pattern="^[0-9]*$" disabled={saving} value={pin} onChange={setPin} aria-label="PIN группы">
          <InputOTPGroup>
            {[0, 1, 2, 3].map(i => <InputOTPSlot key={i} index={i} className="size-12 text-xl" />)}
          </InputOTPGroup>
        </InputOTP>
      </Section>

      <ActionBar>
        {missing && <ActionHint>{missing}</ActionHint>}
        <ActionButton disabled={!!missing} loading={saving} onClick={create}>Создать группу</ActionButton>
      </ActionBar>
    </Page>
  )
}
