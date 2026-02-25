import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAchievmentsInfo } from '@/lib/achievments'

export async function GET(_request: NextRequest) {
  const achievments = getAchievmentsInfo()
  return NextResponse.json(achievments)
}
