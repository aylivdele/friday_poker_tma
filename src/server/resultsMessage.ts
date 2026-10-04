import type { Transfer } from '@/domain/settlement'
import { formatGameDate, formatMoney, playerName } from '@/lib/format'

interface MessagePlayer {
  firstName?: string
  lastName?: string
  username?: string
}

export interface ResultsMessageInput {
  title: string
  date: number
  groupTitle: string
  seasonTitle?: string
  // итоги поправили после завершения
  corrected: boolean
  players: Map<string, MessagePlayer>
  // балансы в целых рублях (roundBalances)
  balances: Record<string, number>
  transfers: Transfer[]
  winners: string[]
  recipientId: string
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function name(players: Map<string, MessagePlayer>, id: string, withUsername = false) {
  const player = players.get(id)
  const text = escapeHtml(playerName(player))
  return withUsername && player?.username ? `${text} (@${escapeHtml(player.username)})` : text
}

// Личное сообщение участнику: его итог, кому он переводит или кто переводит ему, затем общая картина
export function buildResultsMessage(input: ResultsMessageInput): string {
  const { players, balances, transfers, recipientId } = input
  const lines: string[] = []

  lines.push(`${input.corrected ? '✏️ Итоги исправлены' : '🃏 Игра завершена'}: <b>${escapeHtml(input.title || 'Игра')}</b>`)
  lines.push([input.groupTitle, input.seasonTitle, formatGameDate(input.date)].filter(Boolean).map(s => escapeHtml(s!)).join(' · '))
  lines.push('')

  const mine = balances[recipientId] ?? 0
  lines.push(`Ваш итог: <b>${formatMoney(mine, { sign: true })}</b>`)
  const outgoing = transfers.filter(t => t.from === recipientId)
  const incoming = transfers.filter(t => t.to === recipientId)
  if (outgoing.length > 0) {
    lines.push('', outgoing.length === 1 ? 'Переведите:' : 'Переведите (выигрыша одного человека не хватает на весь долг):')
    lines.push(...outgoing.map(t => `• ${name(players, t.to, true)} — <b>${formatMoney(t.amount)}</b>`))
  }
  if (incoming.length > 0) {
    lines.push('', 'Вам переведут:')
    lines.push(...incoming.map(t => `• ${name(players, t.from, true)} — <b>${formatMoney(t.amount)}</b>`))
  }
  if (outgoing.length === 0 && incoming.length === 0) {
    lines.push('Переводов нет — вы в нуле 👌')
  }

  lines.push('', '<b>Итоги</b>')
  const ranking = Object.entries(balances).sort(([a, x], [b, y]) => y - x || name(players, a).localeCompare(name(players, b)))
  for (const [id, balance] of ranking) {
    const trophy = input.winners.includes(id) && balance > 0 ? '🏆 ' : ''
    const you = id === recipientId ? ' (вы)' : ''
    lines.push(`${trophy}${name(players, id)}${you} — ${formatMoney(balance, { sign: true })}`)
  }

  const others = transfers.filter(t => t.from !== recipientId && t.to !== recipientId)
  if (others.length > 0) {
    lines.push('', '<b>Остальные переводы</b>')
    lines.push(...others.map(t => `${name(players, t.from)} → ${name(players, t.to)}: ${formatMoney(t.amount)}`))
  }

  return lines.join('\n')
}
