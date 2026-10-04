import type { PropsWithChildren } from 'react'
import { CircleAlertIcon, Loader2Icon, SearchXIcon } from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'
import { isNull } from '@/lib/helpers'

// Состояния загрузки данных: крутилка, ошибка или «не найдено»; иначе рисует children
export function Loader({ data, isLoading, error, children }: PropsWithChildren<{ data: any, isLoading: boolean, error: any }>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-10 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
        Загрузка…
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <CircleAlertIcon className="size-8 text-destructive" />
        <p className="font-medium">Не удалось загрузить</p>
        <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      </div>
    )
  }
  if (isNull(data)) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-muted-foreground">
        <SearchXIcon className="size-8" />
        Не найдено
      </div>
    )
  }
  return children
}
