'use client'

import type { Achievment } from '@/types/api'
import { useState } from 'react'
import useSWR from 'swr'
import { Section } from '@/components/app/Section'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/format'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { cn } from '@/lib/utils'

type Progresses = Pick<Achievment, 'id' | 'progress'>[] | undefined

const isDone = (a: Achievment) => a.progress[0] >= a.progress[1]

function merge(all: Omit<Achievment, 'progress'>[], progresses: Progresses): Achievment[] {
  return all
    .map(a => ({ ...a, progress: progresses?.find(p => p.id === a.id)?.progress ?? [0, a.maxProgress] as [number, number] }))
    // Секретные показываем только полученными
    .filter(a => !a.isSecret || isDone(a))
    // Полученные — от самых редких, остальные — от самых близких к получению
    .sort((a, b) => {
      const ratio = (x: Achievment) => x.progress[0] / x.progress[1]
      return Number(isDone(b)) - Number(isDone(a))
        || (isDone(a) ? (a.earnedShare ?? 1) - (b.earnedShare ?? 1) : ratio(b) - ratio(a))
    })
}

function formatShare(share: number | undefined) {
  if (share === undefined) {
    return null
  }
  if (share === 0) {
    return 'Пока нет ни у кого'
  }
  if (share >= 1) {
    return 'Есть у всех игроков'
  }
  const percent = share * 100
  return `Есть у ${percent < 1 ? 'меньше 1' : Math.round(percent)}% игроков`
}

function formatProgress(a: Achievment, value: number) {
  return a.unit === 'money' ? formatMoney(value) : String(value)
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
    <Section title={`Достижения · ${earned} из ${achievements.length}`} cardClassName="divide-y-0 overflow-visible bg-transparent">
      <div className="grid grid-cols-3 gap-2">
        {achievements.map((a) => {
          const done = a.progress[0] >= a.progress[1]
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              className={cn('flex flex-col items-center gap-1.5 rounded-2xl bg-card px-1 pt-3 pb-2.5 text-center transition-colors active:bg-muted', done && 'ring-1 ring-gold/40')}
            >
              <span className={cn('text-[32px] leading-none', !done && 'opacity-35 grayscale')} aria-hidden>{done ? a.icon : '❓'}</span>
              <span className={cn('line-clamp-3 min-h-8 max-w-full text-xs leading-4 font-medium hyphens-auto break-words', !done && 'text-muted-foreground')}>{a.name}</span>
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
                  <span className="text-center text-sm text-muted-foreground">
                    {`${formatProgress(selected, Math.min(selected.progress[0], selected.progress[1]))} из ${formatProgress(selected, selected.progress[1])}`}
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center gap-0.5 text-center text-sm">
                {isDone(selected) && <p className="font-medium text-gold">Получено</p>}
                {formatShare(selected.earnedShare) && <p className="text-muted-foreground">{formatShare(selected.earnedShare)}</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Section>
  )
}
