'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ErrorScreen } from '@/components/ErrorPage'
import { Button } from '@/components/ui/button'

export default function RouteError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorScreen title="Не удалось открыть экран" description={error.message}>
      <Button size="lg" onClick={reset}>Повторить</Button>
      <Button size="lg" variant="outline" asChild>
        <Link href="/">На главную</Link>
      </Button>
    </ErrorScreen>
  )
}
