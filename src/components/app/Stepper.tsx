import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { haptic } from '@/lib/haptics'

// «− 3 +» для входов и стеков
export function Stepper({ value, onChange, min = 0, max = Infinity, label }: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  // что считаем — для подписей кнопок у скринридера
  label: string
}) {
  const change = (next: number) => {
    haptic('tap')
    onChange(next)
  }
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button type="button" variant="secondary" size="icon" className="size-10 rounded-xl" aria-label={`Меньше: ${label}`} disabled={value <= min} onClick={() => change(value - 1)}>
        <MinusIcon className="size-[18px]" strokeWidth={2.6} />
      </Button>
      <span className="w-7 text-center text-[17px] font-semibold tabular-nums" aria-live="polite">{value}</span>
      <Button type="button" variant="secondary" size="icon" className="size-10 rounded-xl" aria-label={`Больше: ${label}`} disabled={value >= max} onClick={() => change(value + 1)}>
        <PlusIcon className="size-[18px]" strokeWidth={2.6} />
      </Button>
    </div>
  )
}
