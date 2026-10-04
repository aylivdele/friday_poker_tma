import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

// Выигрыш зелёным, проигрыш красным; знак +/− виден и без цвета
export function MoneyText({ value, className }: { value: number, className?: string }) {
  const rounded = Math.round(value)
  return (
    <span className={cn('font-semibold whitespace-nowrap tabular-nums', rounded > 0 ? 'text-gain' : rounded < 0 ? 'text-loss' : 'text-muted-foreground', className)}>
      {formatMoney(value, { sign: true })}
    </span>
  )
}
