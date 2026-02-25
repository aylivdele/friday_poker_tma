import type { Player } from '@/types/api'
import { Avatar, Cell, List, Section, Text } from '@telegram-apps/telegram-ui'
import { openTelegramLink } from '@tma.js/sdk-react'
import { Achievments } from './Achievments'

export function PlayerComponent({ player }: { player: Player }) {
  return (
    <List>
      <Section header={`Профиль: ${player.firstName} ${player.lastName}`}>
        <List>
          <Avatar size={96} src={player.avatarUrl} style={{ margin: '20px calc(50% - 48px)' }} />
          {player.telegramId
            ? (
                <Cell before={<Text>Telegram:</Text>} onClick={() => openTelegramLink?.(`https://t.me/${player.username}`)}>
                  <Text Component="a">{player.username}</Text>
                </Cell>
              )
            : <Cell>Не занятый пользователь</Cell>}
        </List>
      </Section>
      <Section header="Достижения">
        <Achievments progresses={player.achievments} />
      </Section>
    </List>
  )
}
