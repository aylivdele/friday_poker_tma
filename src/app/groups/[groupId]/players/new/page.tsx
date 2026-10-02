'use client'

import { Avatar, Cell, FileInput, Input, Section, Subheadline } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'
import toast from 'react-hot-toast'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { resizeAvatar } from '@/lib/image'

export default function NewPlayerPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [avatar, setAvatar] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const save = async () => {
    setSaving(true)
    try {
      await api.post(`/api/players?groupId=${groupId}`, { firstName, lastName, avatarUrl: avatar })
      toast.success('Игрок добавлен')
      router.replace(`/groups/${groupId}`)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
    finally {
      setSaving(false)
    }
  }

  const readFile = (file?: Blob) => {
    if (!file) {
      setAvatar('')
      return
    }
    resizeAvatar(file)
      .then(setAvatar)
      .catch(e => toast.error(`Не удалось загрузить изображение: ${getErrorMessage(e)}`))
  }

  return (
    <Page>
      <Section header="Новый игрок" footer="Игрок без Telegram. Позже он сможет занять этот профиль через «Занять профиль» в группе.">
        <Input
          className="input"
          value={firstName}
          before={<Subheadline>Имя</Subheadline>}
          disabled={saving}
          onChange={e => setFirstName(e.target.value)}
        />
        <Input
          className="input"
          value={lastName}
          before={<Subheadline>Фамилия</Subheadline>}
          disabled={saving}
          onChange={e => setLastName(e.target.value)}
        />
        { avatar
          ? (<Cell onClick={() => setAvatar('')} before={<Avatar size={48} src={avatar} />}>Удалить аватар</Cell>)
          : (
              <FileInput
                label="Добавить аватарку"
                onChange={e => readFile(e.target.files?.[0])}
                type="file"
                accept="image/*"
              />
            )}
      </Section>

      <ActionBar>
        <ActionButton disabled={!firstName.trim()} loading={saving} onClick={save}>Сохранить игрока</ActionButton>
      </ActionBar>
    </Page>
  )
}
