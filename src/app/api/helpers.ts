import type { NextRequest } from 'next/server'

export function getTelegramId(req: NextRequest) {
  const id = req.headers.get('x-telegram-id')
  if (!id)
    throw new Error('Unauthorized')
  return Number(id)
}

export function nonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
