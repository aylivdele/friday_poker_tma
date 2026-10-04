import { cn } from '@/lib/utils'
import { colorFor } from './PlayerAvatar'

// Квадратная «аватарка» группы из первых букв названия
export function GroupAvatar({ group, className }: { group: { _id: string, title: string }, className?: string }) {
  const letters = group.title.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '?'
  return (
    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold', colorFor(group._id), className)}>
      {letters}
    </span>
  )
}
