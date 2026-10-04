'use client'

import type { Achievment } from '@/types/api'
import { useState } from 'react'
import useSWR from 'swr'
import { Section } from '@/components/app/Section'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { cn } from '@/lib/utils'

type Progresses = Pick<Achievment, 'id' | 'progress'>[] | undefined

function merge(all: Omit<Achievment, 'progress'>[], progresses: Progresses): Achievment[] {
  return all
    .map(a => ({ ...a, progress: progresses?.find(p => p.id === a.id)?.progress ?? [0, a.maxProgress] as [number, number] }))
    // Секретные показываем только полученными
    .filter(a => !a.isSecret || a.progress[0] >= a.progress[1])
    .sort((a, b) => {
      const done = (x: Achievment) => Number(x.progress[0] >= x.progress[1])
      const ratio = (x: Achievment) => x.progress[0] / x.progress[1]
      return done(b) - done(a) || ratio(b) - ratio(a)
    })
}

// Сетка достижений: полученные сверху, по нажатию — описание и прогресс
export function AchievementsGrid({ progresses }: { progresses: Progresses }) {
  const { data } = useSWR<Omit<Achievment, 'progress'>[]>('/api/achievments', swrGetFetcher)
  const [selected, setSelected] = useState<Achievment | null>(null)
  if (!data) {
    return null
  }
  const achievements = merge(data, progresses)
  const earned = achievements.filter(a => a.progress[0] >= a.progress[1]).length

  return (
    <Section title={`Достижения · ${earned} из ${achievements.length}`} cardClassName="divide-y-0 bg-transparent">
      <div className="grid grid-cols-3 gap-2">
        {achievements.map((a) => {
          const done = a.progress[0] >= a.progress[1]
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              className={cn('flex flex-col items-center gap-1.5 rounded-2xl bg-card px-2 pt-3 pb-2.5 text-center transition-colors active:bg-muted', done && 'ring-1 ring-gold/40')}
            >
              <span className={cn('text-[32px] leading-none', !done && 'opacity-35 grayscale')} aria-hidden>{done ? a.icon : '❓'}</span>
              <span className={cn('line-clamp-2 min-h-8 text-xs leading-4 font-medium', !done && 'text-muted-foreground')}>{a.name}</span>
              {!done && a.maxProgress > 1 && <Progress value={(a.progress[0] / a.progress[1]) * 100} className="h-1" />}
            </button>
          )
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-xs">
          {selected && (
            <>
              <DialogHeader className="items-center text-center">
                <span className={cn('text-6xl leading-none', selected.progress[0] < selected.progress[1] && 'opacity-35 grayscale')} aria-hidden>
                  {selected.progress[0] >= selected.progress[1] ? selected.icon : '❓'}
                </span>
                <DialogTitle className="pt-2">{selected.name}</DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              {selected.maxProgress > 1 && (
                <div className="flex flex-col gap-1.5">
                  <Progress value={Math.min(100, (selected.progress[0] / selected.progress[1]) * 100)} />
                  <span className="text-center text-sm text-muted-foreground">{`${Math.min(selected.progress[0], selected.progress[1])} из ${selected.progress[1]}`}</span>
                </div>
              )}
              {selected.progress[0] >= selected.progress[1] && <p className="text-center text-sm font-medium text-gold">Получено</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Section>
  )
}
