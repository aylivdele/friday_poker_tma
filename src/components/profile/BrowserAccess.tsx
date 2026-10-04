'use client'

import type { Me } from '@/types/api'
import { requestContactComplete } from '@tma.js/sdk-react'
import { Loader2Icon, LogOutIcon, PhoneIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { RowText, Section } from '@/components/app/Section'
import { confirmAction } from '@/components/ConfirmButton/ConfirmButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { isTelegram } from '@/lib/platform'
import { swrGetFetcher } from '@/lib/swrFetcher'

const MIN_LENGTH = 8

function PasswordField({ label, value, onChange, autoComplete }: { label: string, value: string, onChange: (value: string) => void, autoComplete: string }) {
  return (
    <label className="flex min-h-14 items-center gap-3 px-3.5 py-2">
      <span className="w-32 shrink-0 text-base">{label}</span>
      <Input type="password" autoComplete={autoComplete} className="h-10 flex-1 rounded-lg text-base" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

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
      {needCurrent && <PasswordField label="Текущий пароль" autoComplete="current-password" value={current} onChange={setCurrent} />}
      <PasswordField label="Новый пароль" autoComplete="new-password" value={password} onChange={setPassword} />
      <PasswordField label="Повторите" autoComplete="new-password" value={repeat} onChange={setRepeat} />
      <div className="flex flex-col gap-2 px-3.5 py-3">
        {problem && <p className="text-sm text-destructive">{problem}</p>}
        <Button variant="secondary" size="lg" className="h-11 rounded-xl text-base" disabled={!ready || saving} onClick={save}>
          {saving && <Loader2Icon className="size-4 animate-spin" />}
          {me.hasPassword ? 'Сменить пароль' : 'Задать пароль'}
        </Button>
      </div>
    </>
  )
}

// Номер и пароль для входа на сайт вне Telegram
export function BrowserAccess() {
  const { data: me, mutate } = useSWR<Me>('/api/me', swrGetFetcher)
  const [busy, setBusy] = useState(false)
  const inTelegram = isTelegram()

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
      description: inTelegram ? 'Завершить вход из браузера на всех устройствах?' : 'Выйти на всех устройствах, включая это?',
      confirmText: 'Выйти',
    })
    if (!confirmed) {
      return
    }
    try {
      await api.post('/api/auth/logout-all')
      if (inTelegram) {
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
    <>
      <Section
        title="Вход из браузера"
        footer={inTelegram ? `На сайте ${siteUrl} можно войти по номеру и паролю — например, с компьютера.` : undefined}
      >
        <div className="flex min-h-14 items-center gap-3 px-3.5 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <PhoneIcon className="size-5" />
          </span>
          <RowText title="Номер телефона" subtitle={me.phone ?? 'не подтверждён'} />
          {inTelegram && (
            <Button variant="secondary" className="h-9 rounded-xl" disabled={busy} onClick={confirmPhone}>
              {busy && <Loader2Icon className="size-4 animate-spin" />}
              {me.phone ? 'Обновить' : 'Подтвердить'}
            </Button>
          )}
        </div>
        {me.phone
          ? <PasswordForm me={me} onSaved={updated => mutate(updated, { revalidate: false })} />
          : inTelegram && <p className="px-3.5 py-3 text-sm text-muted-foreground">Подтвердите номер, чтобы задать пароль: номер будет логином.</p>}
      </Section>

      {(!inTelegram || me.hasPassword) && (
        <Section>
          {!inTelegram && (
            <button type="button" className="flex min-h-12 w-full items-center gap-3 px-3.5 text-left text-base transition-colors hover:bg-muted/60" onClick={logout}>
              <LogOutIcon className="size-5 text-muted-foreground" />
              Выйти
            </button>
          )}
          {me.hasPassword && (
            <button type="button" className="flex min-h-12 w-full items-center gap-3 px-3.5 text-left text-base text-destructive transition-colors hover:bg-muted/60" onClick={logoutAll}>
              <LogOutIcon className="size-5" />
              {inTelegram ? 'Завершить все входы из браузера' : 'Выйти на всех устройствах'}
            </button>
          )}
        </Section>
      )}
    </>
  )
}
