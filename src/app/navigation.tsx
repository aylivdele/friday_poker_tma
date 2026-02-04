'use client'

import { Tabbar, Text } from '@telegram-apps/telegram-ui'
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
        <Link href="/profile" onClick={() => setCurrentTab('profile')}><Text>Профиль</Text></Link>
      </Tabbar.Item>
      <Tabbar.Item selected={currentTab === 'groups'}>
        <Link href="/groups" onClick={() => setCurrentTab('groups')}><Text>Группы</Text></Link>
      </Tabbar.Item>
      <Tabbar.Item selected={currentTab === 'games'}>
        <Link href="/games" onClick={() => setCurrentTab('games')}><Text>Игры</Text></Link>
      </Tabbar.Item>
    </Tabbar>
  )
}
