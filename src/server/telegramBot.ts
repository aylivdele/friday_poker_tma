import process from 'node:process'
import { botToken } from './auth'

// В автотестах подменяется на локальную заглушку
const API_URL = process.env.TELEGRAM_API_URL || 'https://api.telegram.org'

export type SendResult = 'sent' | 'blocked' | 'failed'

export interface InlineButton {
  text: string
  url?: string
  web_app?: { url: string }
}

/*
 * Личное сообщение от бота. «blocked» — бот не может писать пользователю: тот не разрешил
 * сообщения, не запускал бота или заблокировал его. Ошибки сети не роняют вызывающего.
 */
export async function sendTelegramMessage(chatId: number, text: string, button?: InlineButton): Promise<SendResult> {
  try {
    const response = await fetch(`${API_URL}/bot${botToken()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        ...(button ? { reply_markup: { inline_keyboard: [[button]] } } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (response.ok) {
      return 'sent'
    }
    const data = await response.json().catch(() => null) as { description?: string } | null
    if (response.status === 403 || /chat not found/i.test(data?.description ?? '')) {
      return 'blocked'
    }
    console.error(`Telegram sendMessage to ${chatId} failed: ${response.status} ${data?.description ?? ''}`)
    return 'failed'
  }
  catch (e) {
    console.error(`Telegram sendMessage to ${chatId} failed`, e)
    return 'failed'
  }
}
