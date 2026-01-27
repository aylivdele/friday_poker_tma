'use client'

import { Tabbar } from '@telegram-apps/telegram-ui'
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
        <Link href={`/players/${player._id}`} onClick={() => setCurrentTab('profile')}>Профиль</Link>
      </Tabbar.Item>
      <Tabbar.Item text="Группы" selected={currentTab === 'groups'}>
        <Link href="/groups" onClick={() => setCurrentTab('groups')}>Группы</Link>
      </Tabbar.Item>
      <Tabbar.Item text="Игры" selected={currentTab === 'games'}>
        <Link href="/games" onClick={() => setCurrentTab('games')}>Игры</Link>
      </Tabbar.Item>
    </Tabbar>
  )
}
