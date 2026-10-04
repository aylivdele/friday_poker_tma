'use client'

import type { Player } from '@/types/api'
import { ImagePlusIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { resizeAvatar } from '@/lib/image'

// Имя и фото игрока без Telegram
export function EditPlayerDialog({ open, onOpenChange, player, onSaved }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: Player
  onSaved: (player: Player) => void
}) {
  const [firstName, setFirstName] = useState(player.firstName ?? '')
  const [lastName, setLastName] = useState(player.lastName ?? '')
  const [avatar, setAvatar] = useState(player.avatarUrl ?? '')
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFirstName(player.firstName ?? '')
      setLastName(player.lastName ?? '')
      setAvatar(player.avatarUrl ?? '')
    }
  }, [open, player])

  const save = async () => {
    setSaving(true)
    try {
      onSaved(await api.patch<Player>(`/api/players/${player._id}`, { firstName, lastName, avatarUrl: avatar }))
      toast.success('Сохранено')
      onOpenChange(false)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
    finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Изменить игрока</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-2">
          <PlayerAvatar player={{ ...player, firstName, lastName, avatarUrl: avatar }} className="size-20 **:data-[slot=avatar-fallback]:text-2xl" />
          <div className="flex gap-1">
            <Button variant="ghost" className="h-9 gap-1.5 rounded-xl text-primary-text hover:bg-secondary hover:text-primary-text" onClick={() => fileInput.current?.click()}>
              <ImagePlusIcon className="size-4" />
              {avatar ? 'Другое фото' : 'Добавить фото'}
            </Button>
            {avatar && <Button variant="ghost" className="h-9 rounded-xl text-muted-foreground" onClick={() => setAvatar('')}>Убрать</Button>}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && resizeAvatar(e.target.files[0]).then(setAvatar).catch(err => toast.error(getErrorMessage(err)))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="player-first-name">Имя</Label>
          <Input id="player-first-name" className="h-11 text-base" maxLength={64} value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="player-last-name">Фамилия</Label>
          <Input id="player-last-name" className="h-11 text-base" maxLength={64} value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button size="lg" className="h-11 rounded-xl text-base" disabled={!firstName.trim() || saving} onClick={save}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
