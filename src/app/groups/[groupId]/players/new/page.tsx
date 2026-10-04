'use client'

import type { Group } from '@/types/api'
import { ImagePlusIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useRef, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { Section } from '@/components/app/Section'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { resizeAvatar } from '@/lib/image'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function NewPlayerPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const router = useRouter()
  const { data: group } = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const pickFile = (file?: File) => {
    if (file) {
      resizeAvatar(file)
        .then(setAvatar)
        .catch(e => toast.error(`Не удалось загрузить фото: ${getErrorMessage(e)}`))
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.post(`/api/players?groupId=${groupId}`, { firstName, lastName, avatarUrl: avatar })
      toast.success(`${firstName.trim()} добавлен(а) в группу`)
      router.replace(`/groups/${groupId}`)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <Page title="Новый игрок" subtitle={group?.title}>
      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="relative">
          <PlayerAvatar player={{ firstName, lastName, avatarUrl: avatar }} className="size-24 **:data-[slot=avatar-fallback]:text-3xl" />
          {avatar && (
            <Button variant="secondary" size="icon" className="absolute -top-1 -right-1 size-8 rounded-full" aria-label="Убрать фото" onClick={() => setAvatar('')}>
              <XIcon className="size-4" />
            </Button>
          )}
        </div>
        <Button variant="ghost" className="h-9 gap-1.5 rounded-xl text-primary-text hover:bg-secondary hover:text-primary-text" onClick={() => fileInput.current?.click()}>
          <ImagePlusIcon className="size-4" />
          {avatar ? 'Другое фото' : 'Добавить фото'}
        </Button>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={e => pickFile(e.target.files?.[0])} />
      </div>

      <Section footer="Профиль без Telegram. Если игрок позже откроет приложение, он сможет занять этот профиль — игры и результаты перейдут к нему.">
        <label className="flex min-h-14 items-center gap-3 px-3.5 py-2">
          <span className="w-24 shrink-0 text-base">Имя</span>
          <Input className="h-10 flex-1 rounded-lg text-base" maxLength={64} autoComplete="off" value={firstName} disabled={saving} onChange={e => setFirstName(e.target.value)} />
        </label>
        <label className="flex min-h-14 items-center gap-3 px-3.5 py-2">
          <span className="w-24 shrink-0 text-base">Фамилия</span>
          <Input className="h-10 flex-1 rounded-lg text-base" maxLength={64} autoComplete="off" placeholder="необязательно" value={lastName} disabled={saving} onChange={e => setLastName(e.target.value)} />
        </label>
      </Section>

      <ActionBar>
        <ActionButton disabled={!firstName.trim()} loading={saving} onClick={save}>Добавить игрока</ActionButton>
      </ActionBar>
    </Page>
  )
}
