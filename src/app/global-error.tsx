'use client'

// Последний рубеж: ошибка в самом layout. Стили приложения здесь недоступны, поэтому всё инлайн.
export default function GlobalError({ reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 20 }}>Приложение не запустилось</h1>
          <p style={{ color: '#5F6774' }}>Попробуйте ещё раз через минуту.</p>
          <button type="button" onClick={reset} style={{ marginTop: 12, padding: '12px 20px', borderRadius: 12, border: 'none', background: '#1D7A52', color: '#fff', fontSize: 16 }}>
            Повторить
          </button>
        </div>
      </body>
    </html>
  )
}
