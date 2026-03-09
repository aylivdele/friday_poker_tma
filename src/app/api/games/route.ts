import type { FindCursor, WithId } from 'mongodb'
import type { NextRequest } from 'next/server'
import type { Game } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { isNull, nonNull } from '@/lib/helpers'
import { deserealizeBody, getInitData, getTelegramId } from '../../../lib/serverHelpers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const searchString = searchParams.get('search')
  const seasonId = searchParams.get('seasonId')
  const groupId = searchParams.get('groupId')
  const useInitData = searchParams.get('useInitData') === 'true'

  const db = await getDb()
  let games: FindCursor<WithId<Game>>
  if (useInitData) {
    let initData
    try {
      initData = getInitData(request)
      if (isNull(initData.user?.id)) {
        throw new Error('User id not found')
      }
    }
    catch (error) {
      return NextResponse.json({ error }, { status: 403 })
    }
    const tgId = initData.user.id
    if (isNull(tgId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const player = await db.players.findOne({ telegramId: initData.user?.id })
    if (!player) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    games = db.games.find({ 'players.playerId': player._id })
  }
  else
    if (searchString) {
      games = db.games.find({ title: { $regex: searchString, $options: 'i' } })
    }
    else if (seasonId) {
      games = db.games.find({ seasonId: new ObjectId(seasonId) })
    }
    else if (groupId) {
      games = db.games.find({ groupId: new ObjectId(groupId) })
    }
    else {
      games = db.games.find({}).limit(15)
    }
  return NextResponse.json(await games.toArray())
}

export async function POST(request: NextRequest) {
  const db = await getDb()
  let tgId
  try {
    tgId = getTelegramId(request)
  }
  catch (error) {
    return NextResponse.json({ error }, { status: 403 })
  }
  const caller = await db.players.findOne({ telegramId: tgId })
  console.log(JSON.stringify(caller))

  const newGame = {
    createdAt: Date.now(),
    title: '',
    isFinished: false,
    players: [],
    creater: caller?._id,
    settings: {
      isFinal: false,
      maxReEntries: 5,
      firstEntryCost: 100,
      reEntryCost: 100,
    },
    ...await deserealizeBody<Partial<Game>>(request, 'game'),
  }
  if (isNull(newGame.groupId)) {
    return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
  }
  if (isNull(newGame.seasonId)) {
    return NextResponse.json({ error: 'seasonId is required' }, { status: 400 })
  }

  // @ts-expect-error group id is not undefined
  const result = await db.games.insertOne(newGame)
  if (nonNull(result.insertedId)) {
    await db.seasons.updateOne(
      { _id: newGame.seasonId },
      { $push: { gameIds: result.insertedId } },
    )
  }
  return NextResponse.json(result.insertedId)
}
