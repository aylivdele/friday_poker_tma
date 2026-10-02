import type { ReactNode } from 'react'
import type { Player } from '@/types/api'
import { Avatar, Cell, List, Section, Text } from '@telegram-apps/telegram-ui'
import { openTelegramLink } from '@tma.js/sdk-react'
import { isTelegram } from '@/lib/platform'
import { Achievments } from './Achievments'

function openProfile(username: string) {
  const url = `https://t.me/${username}`
  if (isTelegram()) {
    openTelegramLink(url)
  }
  else {
    window.open(url, '_blank', 'noopener')
  }
}

// children выводятся между карточкой игрока и достижениями
export function PlayerComponent({ player, children }: { player: Player, children?: ReactNode }) {
  const subtitle = player.hasTelegram
    ? (player.username ? `@${player.username}` : undefined)
    : 'Профиль без Telegram'

  return (
    <List>
      <Section header="Профиль игрока">
        <List>
          <Avatar size={96} src={player.avatarUrl} style={{ margin: '20px calc(50% - 48px)' }} />
          <Cell
            onClick={player.username ? () => openProfile(player.username!) : undefined}
            subtitle={subtitle && <Text Component={player.username ? 'a' : 'span'}>{subtitle}</Text>}
          >
            {[player.firstName, player.lastName].filter(Boolean).join(' ')}
          </Cell>
        </List>
      </Section>
      {children}
      <Section header="Достижения">
        <Achievments progresses={player.achievments} />
      </Section>
    </List>
  )
}
