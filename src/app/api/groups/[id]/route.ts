import type { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  const group = await (await getDb()).groups.findOne({ _id: new ObjectId(id) })
  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }
  return NextResponse.json(group)
}
