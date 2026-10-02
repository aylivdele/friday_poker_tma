export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function getErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error) {
    return error
  }
  return fallback
}
