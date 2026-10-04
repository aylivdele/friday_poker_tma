import type { Me } from '@/types/api'
import { requestWriteAccess } from '@tma.js/sdk-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { haptic } from '@/lib/haptics'

// Просит Telegram разрешить боту писать человеку: без этого бот не может начать с ним диалог
export function useAllowBotMessages() {
  const [busy, setBusy] = useState(false)

  const allow = useCallback(async () => {
    setBusy(true)
    try {
      const status = await requestWriteAccess()
      if (status !== 'allowed') {
        return false
      }
      await mutate('/api/me', await api.put<Me>('/api/me/notifications', { botCanWrite: true }), { revalidate: false })
      haptic('success')
      toast.success('Готово: итоги игр придут в Telegram')
      return true
    }
    catch (e) {
      toast.error(`Не удалось получить разрешение: ${getErrorMessage(e)}`)
      return false
    }
    finally {
      setBusy(false)
    }
  }, [])

  return { allow, busy }
}
