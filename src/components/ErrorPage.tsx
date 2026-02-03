import { useEffect } from 'react'
import { Page } from './Page'

export function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset?: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <Page>
      <div>
        <h2>An unhandled error occurred!</h2>
        <blockquote>
          <code>
            {error.message}
          </code>
        </blockquote>
        {reset && <button onClick={() => reset()}>Try again</button>}
      </div>
    </Page>
  )
}
