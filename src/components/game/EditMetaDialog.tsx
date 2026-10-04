'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseDateInput, toDateInputValue } from '@/lib/dates'

// Название и дата игры
export function EditMetaDialog({ open, onOpenChange, title, createdAt, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  createdAt: number
  onSave: (meta: { title: string, createdAt: number }) => void | Promise<void>
}) {
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftDate, setDraftDate] = useState(toDateInputValue(createdAt))

  useEffect(() => {
    if (open) {
      setDraftTitle(title)
      setDraftDate(toDateInputValue(createdAt))
    }
  }, [open, title, createdAt])

  const date = parseDateInput(draftDate)
  const valid = draftTitle.trim().length > 0 && date !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Название и дата</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (valid && date !== null) {
              await onSave({ title: draftTitle.trim(), createdAt: date })
              onOpenChange(false)
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="game-title">Название</Label>
            <Input id="game-title" className="h-11 text-base" maxLength={80} value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="game-date">Дата игры</Label>
            <Input id="game-date" type="date" className="h-11 text-base" value={draftDate} onChange={e => setDraftDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" size="lg" className="h-11 rounded-xl text-base" disabled={!valid}>Сохранить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
