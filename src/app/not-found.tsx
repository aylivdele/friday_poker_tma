import Link from 'next/link'
import { ErrorScreen } from '@/components/ErrorPage'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <ErrorScreen title="Страница не найдена" description="Возможно, её удалили или ссылка неверная.">
      <Button size="lg" asChild>
        <Link href="/">На главную</Link>
      </Button>
    </ErrorScreen>
  )
}
