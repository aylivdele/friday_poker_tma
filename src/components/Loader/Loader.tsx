import type { PropsWithChildren } from 'react'
import { CircleAlertIcon, Loader2Icon, RotateCwIcon, SearchXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/errors'
import { isNull } from '@/lib/helpers'

interface LoaderProps {
  data: any
  isLoading: boolean
  error: any
  // повторить запрос; из SWR приходит вместе с остальными полями ({...swr})
  mutate?: () => unknown
}

// Состояния загрузки данных: крутилка, ошибка или «не найдено»; иначе рисует children
export function Loader({ data, isLoading, error, mutate, children }: PropsWithChildren<LoaderProps>) {
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
        {mutate && (
          <Button variant="secondary" className="mt-2 h-10 gap-1.5 rounded-xl px-4" onClick={() => mutate()}>
            <RotateCwIcon className="size-4" />
            Повторить
          </Button>
        )}
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
