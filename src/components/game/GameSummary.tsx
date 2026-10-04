import type { GameDetails } from '@/types/api'
import { gameBank, totalStacks } from '@/domain/balances'
import { formatMoney } from '@/lib/format'

function Stat({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{children}</span>
    </div>
  )
}

export function GameSummary({ game }: { game: GameDetails }) {
  return (
    <div className="mx-4 grid grid-cols-3 rounded-2xl bg-card px-1.5 py-3.5">
      <Stat label="Банк">{formatMoney(gameBank(game))}</Stat>
      <Stat label="Стеков">{totalStacks(game)}</Stat>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Статус</span>
        {game.isFinished
          ? <span className="rounded-full bg-muted px-2.5 py-0.5 text-[13px] font-semibold">Завершена</span>
          : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[13px] font-semibold text-secondary-foreground">
                <span className="size-1.5 rounded-full bg-secondary-foreground" />
                Идёт
              </span>
            )}
      </div>
    </div>
  )
}
