'use client'

import type { ReactNode } from 'react'
import type { Player, PlayerStats } from '@/types/api'
import { openTelegramLink } from '@tma.js/sdk-react'
import { ChevronRightIcon, PencilIcon, TrophyIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GroupAvatar } from '@/components/app/GroupAvatar'
import { MoneyText } from '@/components/app/MoneyText'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { Row, RowText, Section } from '@/components/app/Section'
import { GameRow } from '@/components/game/GameRow'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatShortDate, playerName, plural } from '@/lib/format'
import { isTelegram } from '@/lib/platform'
import { AchievementsGrid } from './AchievementsGrid'

function openTelegramProfile(username: string) {
  const url = `https://t.me/${username}`
  if (isTelegram()) {
    openTelegramLink(url)
  }
  else {
    window.open(url, '_blank', 'noopener')
  }
}

function Stat({ label, children }: { label: string, children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{children}</span>
    </div>
  )
}

// Профиль игрока: шапка, статистика, группы, последние игры и достижения.
// children выводятся перед достижениями (настройки в своём профиле)
export function PlayerProfile({ player, stats, onEdit, children }: {
  player: Player
  stats?: PlayerStats
  onEdit?: () => void
  children?: ReactNode
}) {
  const router = useRouter()

  return (
    <>
      <div className="flex flex-col items-center gap-1.5 px-4 pt-4 text-center">
        <PlayerAvatar player={player} className="size-24 **:data-[slot=avatar-fallback]:text-3xl" />
        <h1 className="pt-1 text-2xl font-bold">{playerName(player)}</h1>
        {player.hasTelegram
          ? player.username && (
            <button type="button" className="text-[15px] text-primary-text" onClick={() => openTelegramProfile(player.username!)}>
              @
              {player.username}
            </button>
          )
          : <span className="rounded-full bg-muted px-2.5 py-0.5 text-[13px] text-muted-foreground">Профиль без Telegram</span>}
        {onEdit && (
          <Button variant="ghost" className="h-9 gap-1.5 rounded-xl text-primary-text hover:bg-secondary hover:text-primary-text" onClick={onEdit}>
            <PencilIcon className="size-4" />
            Изменить
          </Button>
        )}
      </div>

      {!stats && (
        <div className="grid grid-cols-2 gap-2 px-4 pt-4" aria-hidden>
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[76px] rounded-2xl bg-card" />)}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-2 px-4 pt-4">
            <Stat label="Сыграно">{plural(stats.games, ['игра', 'игры', 'игр'])}</Stat>
            <Stat label="В плюсе">
              {stats.gamesInPlus}
              {stats.games > 0 && <span className="text-sm font-normal text-muted-foreground">{` · ${Math.round((stats.gamesInPlus / stats.games) * 100)}%`}</span>}
            </Stat>
            <Stat label="Финалов выиграно">
              <span className="inline-flex items-center gap-1.5">
                {stats.finalWins}
                {stats.finalWins > 0 && <TrophyIcon className="size-5 text-gold" />}
              </span>
            </Stat>
            <Stat label="Итог за всё время"><MoneyText value={stats.balance} className="text-xl" /></Stat>
          </div>

          {stats.best && (
            <Section title="Лучшая игра">
              <GameRow game={stats.best.game} meta={stats.best.game.groupTitle} meId={player._id} />
            </Section>
          )}

          {stats.groups.length > 0 && (
            <Section title="По группам">
              {stats.groups.map(group => (
                <Row key={group.groupId} onClick={() => router.push(`/groups/${group.groupId}`)}>
                  <GroupAvatar group={{ _id: group.groupId, title: group.title }} />
                  <RowText title={group.title} subtitle={plural(group.games, ['игра', 'игры', 'игр'])} />
                  <MoneyText value={group.balance} />
                  <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
                </Row>
              ))}
            </Section>
          )}

          {stats.recent.length > 0 && (
            <Section title="Последние игры" footer={stats.games > stats.recent.length ? `Всего ${plural(stats.games, ['игра', 'игры', 'игр'])}` : undefined}>
              {stats.recent.map(game => (
                <GameRow key={game._id} game={game} meId={player._id} meta={[game.groupTitle, game.seasonTitle].filter(Boolean).join(' · ')} />
              ))}
            </Section>
          )}

          {stats.games === 0 && (
            <p className="px-6 pt-6 text-center text-sm text-muted-foreground">{`Сыгранных игр пока нет${player.createdAt ? `, в приложении с ${formatShortDate(player.createdAt)}` : ''}`}</p>
          )}
        </>
      )}

      {children}

      <AchievementsGrid progresses={player.achievments} />
    </>
  )
}
