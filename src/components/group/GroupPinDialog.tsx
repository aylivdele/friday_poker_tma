'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { swrGetFetcher } from '@/lib/swrFetcher'

// Владелец смотрит и меняет PIN группы
export function GroupPinDialog({ open, onOpenChange, groupId }: { open: boolean, onOpenChange: (open: boolean) => void, groupId: string }) {
  const { data, mutate } = useSWR<{ pin: string | null }>(open ? `/api/groups/${groupId}/pin` : null, swrGetFetcher)
  const [editing, setEditing] = useState(false)
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await mutate(await api.put<{ pin: string }>(`/api/groups/${groupId}/pin`, { pin }), { revalidate: false })
      toast.success('PIN изменён')
      setEditing(false)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
    finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setEditing(false)
        setPin('')
        onOpenChange(value)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>PIN группы</DialogTitle>
          <DialogDescription>Сообщите его друзьям: с ним можно вступить в группу или занять свой профиль</DialogDescription>
        </DialogHeader>
        {editing
          ? (
              <div className="flex flex-col items-center gap-4 py-2">
                <InputOTP maxLength={4} inputMode="numeric" pattern="^[0-9]*$" autoFocus value={pin} onChange={setPin}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3].map(i => <InputOTPSlot key={i} index={i} className="size-12 text-xl" />)}
                  </InputOTPGroup>
                </InputOTP>
                <Button size="lg" className="h-11 w-full rounded-xl text-base" disabled={pin.length !== 4 || saving} onClick={save}>Сохранить</Button>
              </div>
            )
          : (
              <div className="flex flex-col items-center gap-4 py-2">
                <span className="font-mono text-4xl font-semibold tracking-[0.4em] tabular-nums">{data?.pin ?? '····'}</span>
                <Button variant="secondary" size="lg" className="h-11 w-full rounded-xl text-base" onClick={() => setEditing(true)}>Изменить PIN</Button>
              </div>
            )}
      </DialogContent>
    </Dialog>
  )
}
