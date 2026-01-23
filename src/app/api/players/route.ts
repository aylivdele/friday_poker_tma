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
      telegramId,
      createdAt: new Date(),
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

  if (searchString) {
    const players = await (await getDb()).players.find({
      $or: [
        { firstName: { $regex: searchString, $options: 'i' } },
        { username: { $regex: searchString, $options: 'i' } },
      ],
    }).toArray()
    return NextResponse.json(players)
  }

  if (groupId) {
    const players = await (await getDb()).groups.findOne({ _id: new ObjectId(groupId) }).then(async (group) => {
      return (await getDb()).players.find({ _id: { $in: group?.members } }).toArray()
    })
    return NextResponse.json(players)
  }

  return (await getDb()).players.find({}).limit(5).toArray()
}
