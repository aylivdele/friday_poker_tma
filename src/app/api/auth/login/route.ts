import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { normalizePhone } from '@/lib/phone'
import { toMe } from '@/server/dto'
import { parseBody, route, unauthorized } from '@/server/http'
import { getDummyHash, PASSWORD_MAX_LENGTH, verifyPassword } from '@/server/password'
import { assertNotLocked, registerFailure, resetFailures } from '@/server/rateLimit'
import { createSession, setSessionCookie } from '@/server/sessions'

const loginSchema = z.object({
  phone: z.string().max(32),
  password: z.string().max(PASSWORD_MAX_LENGTH),
})

const WRONG_CREDENTIALS = 'Неверный телефон или пароль'

export const POST = route(async (req) => {
  const body = await parseBody(req, loginSchema)
  const phone = normalizePhone(body.phone)
  // Блокируем по номеру независимо от того, существует ли он, чтобы не подсказывать, какие номера есть
  const limitKey = `login:${phone ?? body.phone}`
  assertNotLocked(limitKey)

  const player = phone ? await (await getDb()).players.findOne({ phone }) : null
  const valid = await verifyPassword(body.password, player?.passwordHash ?? await getDummyHash())
  if (!player?.passwordHash || !valid) {
    registerFailure(limitKey)
    throw unauthorized(WRONG_CREDENTIALS)
  }
  resetFailures(limitKey)

  const { token, sessionId } = await createSession(player._id, req.headers.get('user-agent'))
  const res = NextResponse.json(toMe({ player, via: 'session', sessionId }))
  setSessionCookie(res, token)
  return res
})
