'use client'

import { Button, Tabbar } from '@telegram-apps/telegram-ui'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { usePlayerStore } from '@/stores/playerStore'

export function Navigation() {
  const player = usePlayerStore(s => s.player)
  const router = useRouter()
  const pathname = usePathname()
  const [currentTab, setCurrentTab] = useState<'profile' | 'groups' | 'games'>('profile')

  const switchTab = useCallback((tab: 'profile' | 'groups' | 'games') => {
    const newPath = `/${tab}`
    if (pathname === newPath) {
      return
    }
    setCurrentTab(tab)
    router.push(newPath)
  }, [router, pathname])

  useEffect(() => {
    if (pathname.startsWith('/profile')) {
      setCurrentTab('profile')
    }
    if (pathname.startsWith('/groups')) {
      setCurrentTab('groups')
    }
    if (pathname.startsWith('/games')) {
      setCurrentTab('games')
    }
  }, [pathname])

  if (!player)
    return null

  return (
    <Tabbar>
      <Tabbar.Item selected={currentTab === 'profile'} onClick={() => switchTab('profile')}>
        Профиль
      </Tabbar.Item>
      <Tabbar.Item selected={currentTab === 'groups'} onClick={() => switchTab('groups')}>
        Группы
      </Tabbar.Item>
      <Tabbar.Item selected={currentTab === 'games'} onClick={() => switchTab('games')}>
        Игры
      </Tabbar.Item>
    </Tabbar>
  )
}
