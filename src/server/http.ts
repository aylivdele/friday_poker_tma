import type { NextRequest } from 'next/server'
import type { z } from 'zod'
import { BSON, ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export const badRequest = (message = 'Некорректный запрос') => new HttpError(400, message)
export const unauthorized = (message = 'Требуется авторизация') => new HttpError(401, message)
export const forbidden = (message = 'Недостаточно прав') => new HttpError(403, message)
export const notFound = (message = 'Не найдено') => new HttpError(404, message)
export const conflict = (message: string) => new HttpError(409, message)
export const tooManyRequests = (message = 'Слишком много попыток, попробуйте позже') => new HttpError(429, message)

type Handler<P> = (req: NextRequest, params: P) => Promise<unknown>

// Обёртка над обработчиком маршрута: превращает HttpError и ошибки валидации в JSON { error }
export function route<P = object>(handler: Handler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    try {
      const result = await handler(req, await ctx.params)
      if (result instanceof Response) {
        return result
      }
      return NextResponse.json(result ?? { ok: true })
    }
    catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message }, { status: e.status })
      }
      if (e instanceof BSON.BSONError) {
        return NextResponse.json({ error: 'Некорректный идентификатор' }, { status: 400 })
      }
      console.error(`${req.method} ${req.nextUrl.pathname} failed`, e)
      return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
  }
}

export async function parseBody<T extends z.ZodType>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  let json: unknown
  try {
    json = await req.json()
  }
  catch {
    throw badRequest('Некорректное тело запроса')
  }
  const result = schema.safeParse(json)
  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue?.path.join('.')
    throw badRequest(path ? `Некорректное поле «${path}»: ${issue.message}` : (issue?.message ?? 'Некорректные данные'))
  }
  return result.data
}

const objectIdPattern = /^[0-9a-f]{24}$/i

export function toObjectId(id: string | null | undefined): ObjectId {
  if (!id || !objectIdPattern.test(id)) {
    throw badRequest('Некорректный идентификатор')
  }
  return new ObjectId(id)
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
