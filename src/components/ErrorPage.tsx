import { useEffect } from 'react'

// Показывается вне AppRoot, поэтому без компонентов telegram-ui
export function ErrorPage({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="browser-notice">
      <h2>Что-то пошло не так</h2>
      <p>{error.message}</p>
      <button type="button" onClick={() => window.location.reload()}>Перезагрузить</button>
    </div>
  )
}
