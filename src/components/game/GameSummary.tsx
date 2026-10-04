import type { GameDetails } from '@/types/api'
import { prizeFund, prizePool, totalStacks } from '@/domain/balances'
import { formatMoney } from '@/lib/format'

function Stat({ label, hint, children }: { label: string, hint?: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{children}</span>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function GameSummary({ game }: { game: GameDetails }) {
  const fund = prizeFund(game)
  return (
    <div className="mx-4 grid grid-cols-3 rounded-2xl bg-card px-1.5 py-3.5">
      <Stat label="Банк" hint={fund > 0 ? `вкл. фонд ${formatMoney(fund)}` : undefined}>{formatMoney(prizePool(game))}</Stat>
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
