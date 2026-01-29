import type { NextRequest } from 'next/server'
import type { Game } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { deserealizeBody, nonNull } from '../helpers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const searchString = searchParams.get('search')
  const seasonId = searchParams.get('seasonId')
  const groupId = searchParams.get('groupId')
  let games
  if (searchString) {
    games = (await getDb()).games.find({ title: { $regex: searchString, $options: 'i' } })
  }
  else if (seasonId) {
    games = (await getDb()).games.find({ seasonId: new ObjectId(seasonId) })
  }
  else if (groupId) {
    games = (await getDb()).games.find({ groupId: new ObjectId(groupId) })
  }
  else {
    games = (await getDb()).games.find({}).limit(15)
  }
  return NextResponse.json(await games.toArray())
}

export async function POST(request: NextRequest) {
  const newGame = { createdAt: Date.now(), title: '', isFinished: false, players: [], ...await deserealizeBody<Partial<Game>>(request, 'game') }
  if (!newGame.groupId) {
    return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
  }

  // @ts-expect-error group id is not undefined
  const result = await (await getDb()).games.insertOne(newGame)
  if (nonNull(newGame.seasonId) && nonNull(result.insertedId)) {
    (await getDb()).seasons.updateOne(
      { _id: new ObjectId(newGame.seasonId) },
      { $push: { gameIds: result.insertedId } },
    )
  }
  return NextResponse.json(result)
}
