import type { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { nonNull } from '../helpers'

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
    games = (await getDb()).games.find({})
  }
  return NextResponse.json(games)
}

export async function POST(request: NextRequest) {
  const newGame = { createdAt: Date.now(), title: '', isFinished: false, players: [], ...await request.json() }
  if (nonNull(newGame.seasonId)) {
    newGame.seasonId = new ObjectId(newGame.seasonId)
  }
  if (nonNull(newGame.groupId)) {
    newGame.groupId = new ObjectId(newGame.groupId)
  }

  const result = await (await getDb()).games.insertOne(newGame)
  if (nonNull(newGame.seasonId) && nonNull(result.insertedId)) {
    (await getDb()).seasons.updateOne(
      { _id: new ObjectId(newGame.seasonId) },
      { $push: { gameIds: result.insertedId } },
    )
  }
  return NextResponse.json(result)
}
