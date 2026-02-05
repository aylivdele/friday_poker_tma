'use client'

import { Button, Tabbar } from '@telegram-apps/telegram-ui'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
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

  if (!player)
    return null

  return (
    <Tabbar>
      <Tabbar.Item selected={currentTab === 'profile'}>
        <Button mode="plain" size="s" onClick={() => switchTab('profile')}>Профиль</Button>
      </Tabbar.Item>
      <Tabbar.Item selected={currentTab === 'groups'}>
        <Button mode="plain" size="s" onClick={() => switchTab('groups')}>Группы</Button>
      </Tabbar.Item>
      <Tabbar.Item selected={currentTab === 'games'}>
        <Button mode="plain" size="s" onClick={() => switchTab('games')}>Игры</Button>
      </Tabbar.Item>
    </Tabbar>
  )
}
