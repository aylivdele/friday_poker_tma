import type { NextRequest } from 'next/server'
import type { Player } from '@/types/types'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { getTelegramId } from '../helpers'

export async function POST(req: NextRequest) {
  const telegramId = getTelegramId(req)

  let player: Player | null = await (
    await getDb()
  ).players.findOne({ telegramId })
  if (!player) {
    player = {
      ...await req.json() as Partial<Player>,
      telegramId,
      createdAt: Date.now(),
    }

    const result = await (await getDb()).players.insertOne(player)
    player._id = result.insertedId
  }

  return NextResponse.json(player)
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const searchString = searchParams.get('search')
  const groupId = searchParams.get('groupId')
  let players: Player[]
  if (searchString) {
    players = await (await getDb()).players.find({
      $or: [
        { firstName: { $regex: searchString, $options: 'i' } },
        { username: { $regex: searchString, $options: 'i' } },
      ],
    }).toArray()
  }
  else if (groupId) {
    players = await (await getDb()).groups.findOne({ _id: new ObjectId(groupId) }).then(async (group) => {
      return (await getDb()).players.find({ _id: { $in: group?.members } }).toArray()
    })
  }
  else {
    players = await (await getDb()).players.find({}).limit(5).toArray()
  }

  return NextResponse.json(players)
}
