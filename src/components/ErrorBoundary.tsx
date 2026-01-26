import type { ComponentType, GetDerivedStateFromError, PropsWithChildren } from 'react'
import {
  Component,

} from 'react'

export interface ErrorBoundaryProps extends PropsWithChildren {
  fallback: ComponentType<{ error: Error }>
}

interface ErrorBoundaryState {
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {}

  static getDerivedStateFromError: GetDerivedStateFromError<ErrorBoundaryProps, ErrorBoundaryState> = error => ({ error })

  componentDidCatch(error: Error) {
    this.setState({ error })
  }

  render() {
    const {
      state: {
        error,
      },
      props: {
        fallback: Fallback,
        children,
      },
    } = this

    return error ? <Fallback error={error} /> : children
  }
}
