import type { NextRequest } from 'next/server'
import type { Game } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { nonNull } from '@/lib/helpers'
import { deserealizeBody } from '../../../lib/serverHelpers'

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
  const newGame = {
    createdAt: Date.now(),
    title: '',
    isFinished: false,
    players: [],
    settings: {
      isFinal: false,
      maxReEntries: 5,
      firstEntryCost: 100,
      reEntryCost: 100,
    },
    ...await deserealizeBody<Partial<Game>>(request, 'game'),
  }
  if (!newGame.groupId) {
    return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
  }
  else {
    newGame.groupId = new ObjectId(newGame.groupId)
  }
  if (!newGame.seasonId) {
    return NextResponse.json({ error: 'seasonId is required' }, { status: 400 })
  }
  else {
    newGame.seasonId = new ObjectId(newGame.seasonId)
  }

  // @ts-expect-error group id is not undefined
  const result = await (await getDb()).games.insertOne(newGame)
  if (nonNull(result.insertedId)) {
    (await getDb()).seasons.updateOne(
      { _id: newGame.seasonId },
      { $push: { gameIds: result.insertedId } },
    )
  }
  return NextResponse.json(result.insertedId)
}
