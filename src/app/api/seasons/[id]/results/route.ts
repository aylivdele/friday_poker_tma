import type { NextRequest } from 'next/server'
import type { SeasonTable, SeasonTableResponse } from '@/types/api'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { calculateSeasonResults } from './results'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<SeasonTableResponse>> {
  const { id } = await params

  const db = await getDb()

  let table: SeasonTable | undefined = (await db.seasons.findOne({ _id: new ObjectId(id) }, { projection: { table: 1 } }))?.table

  if (!table) {
    table = await calculateSeasonResults(id)
  }
  const players = (await db.players.find({ _id: { $in: Object.keys(table.totals).map(id => new ObjectId(id)) } }).toArray())
    .map(p => ({ ...p, _id: p._id.toString() }))
    .sort((a, b) => {
      const totalA = table.totals[a._id] ?? 0
      const totalB = table.totals[b._id] ?? 0

      return totalB - totalA
    })

  return NextResponse.json({
    ...table,
    players,
  })
}
