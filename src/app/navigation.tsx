'use client'

import { Button, Tabbar, Text } from '@telegram-apps/telegram-ui'
import { useState } from 'react'
import { Link } from '@/components/Link/Link'
import { usePlayerStore } from '@/stores/playerStore'

export function Navigation() {
  const player = usePlayerStore(s => s.player)
  const [currentTab, setCurrentTab] = useState<'profile' | 'groups' | 'games'>('profile')

  if (!player)
    return null

  return (
    <Tabbar>
      <Tabbar.Item selected={currentTab === 'profile'}>
        <Button mode="plain" size="s" href="/profile" onClick={() => setCurrentTab('profile')}>Профиль</Button>
      </Tabbar.Item>
      <Tabbar.Item selected={currentTab === 'groups'}>
        <Button mode="plain" size="s" href="/groups" onClick={() => setCurrentTab('groups')}>Группы</Button>
      </Tabbar.Item>
      <Tabbar.Item selected={currentTab === 'games'}>
        <Button mode="plain" size="s" href="/games" onClick={() => setCurrentTab('games')}>Игры</Button>
      </Tabbar.Item>
    </Tabbar>
  )
}
