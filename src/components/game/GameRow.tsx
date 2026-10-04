'use client'

import type { Game } from '@/types/api'
import { ChevronRightIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MoneyText } from '@/components/app/MoneyText'
import { Row } from '@/components/app/Section'
import { calcGameBalances } from '@/domain/balances'
import { formatShortDate, plural } from '@/lib/format'

export function FinalBadge() {
  return <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-semibold text-gold">Финал</span>
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[13px] font-semibold text-secondary-foreground">
      <span className="size-1.5 rounded-full bg-secondary-foreground" />
      Идёт
    </span>
  )
}

// Строка игры в списках: название, дата и состав (или группа и сезон); справа — мой итог или «Идёт»
export function GameRow({ game, meId, meta }: { game: Game, meId?: string, meta?: string }) {
  const router = useRouter()
  const myBalance = game.isFinished && meId && game.players.some(p => p.playerId === meId)
    ? calcGameBalances(game)[meId] ?? 0
    : null

  return (
    <Row onClick={() => router.push(`/groups/${game.groupId}/seasons/${game.seasonId}/games/${game._id}`)}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-base font-medium">
          <span className="truncate">{game.title || 'Игра'}</span>
          {game.settings.isFinal && <FinalBadge />}
        </span>
        <span className="truncate text-[13px] text-muted-foreground">
          {/* в общих списках важнее группа и сезон, в списке сезона — состав */}
          {[formatShortDate(game.createdAt), meta || plural(game.players.length, ['игрок', 'игрока', 'игроков'])].join(' · ')}
        </span>
      </div>
      {!game.isFinished
        ? <LiveBadge />
        : myBalance !== null && <MoneyText value={myBalance} />}
      <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
    </Row>
  )
}
