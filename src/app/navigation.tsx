'use client'

import type { LucideIcon } from 'lucide-react'
import { SpadeIcon, UserRoundIcon, UsersRoundIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'

const tabs: { href: string, label: string, icon: LucideIcon }[] = [
  { href: '/games', label: 'Игры', icon: SpadeIcon },
  { href: '/groups', label: 'Группы', icon: UsersRoundIcon },
  { href: '/profile', label: 'Профиль', icon: UserRoundIcon },
]

export function Navigation() {
  const player = usePlayerStore(s => s.player)
  const pathname = usePathname()

  // На формах и в редакторе игры вкладки только занимают место над кнопками действий
  const isEditor = /\/new$|\/games\/[0-9a-f]{24}$/.test(pathname)
  if (!player || isEditor)
    return null

  return (
    <nav className="grid grid-cols-3 px-2 pt-1 pb-1">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            replace
            aria-current={active ? 'page' : undefined}
            onClick={() => haptic('select')}
            className={cn(
              'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors',
              active ? 'text-primary-text' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-6" strokeWidth={active ? 2.2 : 1.8} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
