import type { ObjectId, WithId } from 'mongodb'
import type { NextRequest, NextResponse } from 'next/server'
import type { Player, Session } from '@/types/db'
import { createHash, randomBytes } from 'node:crypto'
import process from 'node:process'
import { getDb } from '@/core/db'

const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000
// Продлеваем сессию не чаще раза в сутки, чтобы не писать в базу на каждый запрос
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000

const secure = process.env.NODE_ENV === 'production'
// Префикс __Host- запрещает подмену cookie с поддоменов, но требует HTTPS
export const SESSION_COOKIE = secure ? '__Host-fp_session' : 'fp_session'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(playerId: ObjectId, userAgent?: string | null): Promise<{ token: string, sessionId: ObjectId }> {
  const token = randomBytes(32).toString('base64url')
  const now = new Date()
  const { insertedId } = await (await getDb()).sessions.insertOne({
    playerId,
    tokenHash: hashToken(token),
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    userAgent: userAgent?.slice(0, 200) ?? undefined,
  })
  return { token, sessionId: insertedId }
}

export async function findSession(req: NextRequest): Promise<{ session: WithId<Session>, player: WithId<Player> } | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    return null
  }
  const db = await getDb()
  const session = await db.sessions.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } })
  if (!session) {
    return null
  }
  const player = await db.players.findOne({ _id: session.playerId })
  if (!player) {
    return null
  }
  if (Date.now() - session.lastSeenAt.getTime() > RENEW_AFTER_MS) {
    const now = new Date()
    await db.sessions.updateOne({ _id: session._id }, { $set: { lastSeenAt: now, expiresAt: new Date(now.getTime() + SESSION_TTL_MS) } })
  }
  return { session, player }
}

export async function deleteSessionByToken(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    await (await getDb()).sessions.deleteOne({ tokenHash: hashToken(token) })
  }
}

export async function deletePlayerSessions(playerId: ObjectId, exceptSessionId?: ObjectId) {
  await (await getDb()).sessions.deleteMany(exceptSessionId ? { playerId, _id: { $ne: exceptSessionId } } : { playerId })
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 0 })
}
