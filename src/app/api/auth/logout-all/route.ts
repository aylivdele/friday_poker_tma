import { NextResponse } from 'next/server'
import { requireAuth } from '@/server/auth'
import { route } from '@/server/http'
import { clearSessionCookie, deletePlayerSessions } from '@/server/sessions'

// Завершает все сессии входа из браузера, в том числе текущую
export const POST = route(async (req) => {
  const auth = await requireAuth(req)
  await deletePlayerSessions(auth.player._id)
  const res = NextResponse.json({ ok: true })
  if (auth.via === 'session') {
    clearSessionCookie(res)
  }
  return res
})
