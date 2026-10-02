import { NextResponse } from 'next/server'
import { route } from '@/server/http'
import { clearSessionCookie, deleteSessionByToken } from '@/server/sessions'

export const POST = route(async (req) => {
  await deleteSessionByToken(req)
  const res = NextResponse.json({ ok: true })
  clearSessionCookie(res)
  return res
})
