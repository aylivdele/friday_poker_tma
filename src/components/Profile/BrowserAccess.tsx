'use client'

import type { Me } from '@/types/api'
import { Button, Cell, Input, Section, Subheadline, Text } from '@telegram-apps/telegram-ui'
import { requestContactComplete } from '@tma.js/sdk-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { isTelegram } from '@/lib/platform'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { confirmAction } from '../ConfirmButton/ConfirmButton'

const MIN_LENGTH = 8

function PasswordForm({ me, onSaved }: { me: Me, onSaved: (me: Me) => void }) {
  const needCurrent = me.authVia === 'session'
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [saving, setSaving] = useState(false)

  const problem = password.length > 0 && password.length < MIN_LENGTH
    ? `Пароль — не короче ${MIN_LENGTH} символов`
    : repeat && repeat !== password ? 'Пароли не совпадают' : null
  const ready = password.length >= MIN_LENGTH && repeat === password && (!needCurrent || current)

  const save = async () => {
    setSaving(true)
    try {
      onSaved(await api.put<Me>('/api/me/password', { password, currentPassword: needCurrent ? current : undefined }))
      setCurrent('')
      setPassword('')
      setRepeat('')
      toast.success(me.hasPassword ? 'Пароль изменён' : 'Пароль задан — теперь можно войти из браузера')
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
    finally {
      setSaving(false)
    }
  }

  return (
    <>
      {needCurrent && (
        <Input className="input" type="password" autoComplete="current-password" before={<Subheadline>Текущий пароль</Subheadline>} value={current} onChange={e => setCurrent(e.target.value)} />
      )}
      <Input className="input" type="password" autoComplete="new-password" before={<Subheadline>Новый пароль</Subheadline>} value={password} onChange={e => setPassword(e.target.value)} />
      <Input className="input" type="password" autoComplete="new-password" before={<Subheadline>Повторите</Subheadline>} value={repeat} onChange={e => setRepeat(e.target.value)} />
      {problem && <Cell multiline><Text style={{ color: 'var(--tgui--destructive_text_color)' }}>{problem}</Text></Cell>}
      <div style={{ padding: 16 }}>
        <Button stretched mode="bezeled" disabled={!ready} loading={saving} onClick={save}>
          {me.hasPassword ? 'Сменить пароль' : 'Задать пароль'}
        </Button>
      </div>
    </>
  )
}

export function BrowserAccess() {
  const { data: me, mutate } = useSWR<Me>('/api/me', swrGetFetcher)
  const [busy, setBusy] = useState(false)

  if (!me) {
    return null
  }

  const confirmPhone = async () => {
    setBusy(true)
    try {
      const { raw } = await requestContactComplete()
      await mutate(await api.post<Me>('/api/me/phone', { contactRaw: raw }), { revalidate: false })
      toast.success('Номер подтверждён')
    }
    catch (e) {
      toast.error(`Не удалось подтвердить номер: ${getErrorMessage(e)}`)
    }
    finally {
      setBusy(false)
    }
  }

  const logoutAll = async () => {
    const confirmed = await confirmAction({
      description: isTelegram()
        ? 'Завершить вход из браузера на всех устройствах?'
        : 'Выйти на всех устройствах, включая это?',
      confirmText: 'Выйти',
    })
    if (!confirmed) {
      return
    }
    try {
      await api.post('/api/auth/logout-all')
      if (isTelegram()) {
        toast.success('Все входы из браузера завершены')
      }
      else {
        window.location.replace('/login')
      }
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const logout = async () => {
    await api.post('/api/auth/logout').catch(() => {})
    window.location.replace('/login')
  }

  const siteUrl = window.location.origin.replace(/^https?:\/\//, '')

  return (
    <Section
      header="Вход из браузера"
      footer={isTelegram() ? `На сайте ${siteUrl} можно войти по номеру и паролю — например, с компьютера.` : undefined}
    >
      <Cell
        subtitle={me.phone ?? 'не подтверждён'}
        after={isTelegram() && (
          <Button size="s" mode="bezeled" loading={busy} onClick={confirmPhone}>
            {me.phone ? 'Обновить' : 'Подтвердить'}
          </Button>
        )}
      >
        Номер телефона
      </Cell>

      {me.phone
        ? <PasswordForm me={me} onSaved={updated => mutate(updated, { revalidate: false })} />
        : isTelegram() && <Cell multiline><Text>Подтвердите номер, чтобы задать пароль: номер будет логином.</Text></Cell>}

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!isTelegram() && <Button stretched mode="bezeled" onClick={logout}>Выйти</Button>}
        {me.hasPassword && (
          <Button stretched mode="plain" onClick={logoutAll}>
            {isTelegram() ? 'Завершить все входы из браузера' : 'Выйти на всех устройствах'}
          </Button>
        )}
      </div>
    </Section>
  )
}
