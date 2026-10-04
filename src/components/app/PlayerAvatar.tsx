import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

// Пары «фон / буквы» для светлой и тёмной темы; цвет выбирается по id, чтобы у игрока он был постоянным
const COLORS = [
  'bg-[#E3F0E8] text-[#1D6B47] dark:bg-[#1E3A2B] dark:text-[#7FD7A9]',
  'bg-[#E6EAFB] text-[#3346AD] dark:bg-[#232B52] dark:text-[#A9B8FF]',
  'bg-[#F7E9DC] text-[#9A4F16] dark:bg-[#3D2A1A] dark:text-[#F0B07A]',
  'bg-[#F3E3F0] text-[#8E3B7C] dark:bg-[#3A2236] dark:text-[#E9A6DA]',
  'bg-[#E1EFF3] text-[#2B6476] dark:bg-[#1C3540] dark:text-[#8FD3E8]',
  'bg-[#F4F1DA] text-[#7A6512] dark:bg-[#38341A] dark:text-[#E2D27A]',
]

function colorFor(id: string) {
  let hash = 0
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function PlayerAvatar({ player, className }: {
  player?: { _id?: string, firstName?: string, lastName?: string, avatarUrl?: string } | null
  className?: string
}) {
  return (
    <Avatar className={cn('size-10', className)}>
      {player?.avatarUrl && <AvatarImage src={player.avatarUrl} alt="" className="object-cover" />}
      <AvatarFallback className={cn('text-[15px] font-semibold', colorFor(player?._id ?? ''))}>
        {initials(player)}
      </AvatarFallback>
    </Avatar>
  )
}
