import { CheckIcon, CloudOffIcon, Loader2Icon } from 'lucide-react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1">
        <Loader2Icon className="size-3.5 animate-spin" />
        Сохранение…
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <CloudOffIcon className="size-3.5" />
        Не сохранено
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1">
      <CheckIcon className="size-3.5" strokeWidth={2.6} />
      Сохранено
    </span>
  )
}
