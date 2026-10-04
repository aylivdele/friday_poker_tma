'use client'

import type { ReactNode } from 'react'
import { CircleAlertIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function ErrorScreen({ title, description, children }: { title: string, description?: string, children?: ReactNode }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <CircleAlertIcon className="size-10 text-destructive" />
      <h1 className="text-xl font-semibold">{title}</h1>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>
    </div>
  )
}

// Запасной экран для ошибок вне страниц (показывается вне AppRoot, поэтому без telegram-ui)
export function ErrorPage({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorScreen title="Что-то пошло не так" description={error.message}>
      <Button size="lg" onClick={() => window.location.reload()}>Перезагрузить</Button>
    </ErrorScreen>
  )
}
