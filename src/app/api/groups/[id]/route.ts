import type { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { getTelegramId } from '../../helpers'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  const group = await (await getDb()).groups.findOne({ _id: new ObjectId(id) })
  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }
  return NextResponse.json(group)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  let telegramId
  try {
    telegramId = getTelegramId(request)
  }
  catch (error) {
    return NextResponse.json({ error }, { status: 403 })
  }
  const user = await (await getDb()).players.findOne({ telegramId })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }
  const result = await (await getDb()).groups.deleteOne({ $and: [{ ownerId: user?._id }, { _id: new ObjectId(id) }] })
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Group not found or you are not the owner' }, { status: 404 })
  }
  return NextResponse.json({ message: 'Group deleted successfully' })
}
