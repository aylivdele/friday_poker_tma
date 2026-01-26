import type { NextRequest } from 'next/server'
import process from 'node:process'
import { parse, SignatureInvalidError, validate } from '@tma.js/init-data-node'
import { ObjectId } from 'mongodb'

export function getTelegramId(req: NextRequest) {
  const initDataRaw = req.headers.get('x-init-data')
  try {
    validate(initDataRaw ?? '', process.env.TELEGRAM_BOT_TOKEN ?? '')
  }
  catch (e) {
    if (!SignatureInvalidError.is(e)) {
      console.error('Init data validation error:', e)
    }
    throw new Error('Unauthorized')
  }
  const initData = parse(initDataRaw!)
  if (isNull(initData.user?.id))
    throw new Error('Unauthorized')
  return Number(initData.user.id)
}

export function nonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function isNull<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined
}

export async function deserealizeBody<T>(req: NextRequest, type: 'game' | 'player' | 'group' | 'season'): Promise<T> {
  const obj = await req.json()
  if (obj._id) {
    obj._id = new ObjectId(obj._id)
  }
  switch (type) {
    case 'game':
      if (nonNull(obj.groupId)) {
        obj.groupId = new ObjectId(obj.groupId)
      }
      if (Array.isArray(obj.players)) {
        obj.players = obj.players.map((p: any) => ({
          ...p,
          playerId: new ObjectId(p.playerId),
        }))
      }
      if (Array.isArray(obj.results)) {
        obj.results = obj.results.map((r: any) => ({
          ...r,
          playerId: new ObjectId(r.playerId),
        }))
      }
      if (obj.seasonId) {
        obj.seasonId = new ObjectId(obj.seasonId)
      }
      return obj
    case 'player':
      if (nonNull(obj.groupId)) {
        obj.groupId = new ObjectId(obj.groupId)
      }
      return obj
    case 'group':
      if (obj.ownerId) {
        obj.ownerId = new ObjectId(obj.ownerId)
      }
      if (Array.isArray(obj.members)) {
        obj.members = obj.members.map((m: any) => new ObjectId(m))
      }
      return obj
    case 'season':
      if (nonNull(obj.groupId)) {
        obj.groupId = new ObjectId(obj.groupId)
      }
      if (Array.isArray(obj.gameIds)) {
        obj.gameIds = obj.gameIds.map((g: any) => new ObjectId(g))
      }
      return obj
  }
  return obj
}
