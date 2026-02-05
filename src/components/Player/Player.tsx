import type { Player } from '@/types/api'
import { Avatar, AvatarStack, Cell, Info, List, Section, Text } from '@telegram-apps/telegram-ui'
import { openTelegramLink } from '@tma.js/sdk-react'

export function PlayerComponent({ player }: { player: Player }) {
  return (
    <Section header={`Профиль: ${player.firstName} ${player.lastName}`}>
      <List>
        <Avatar size={96} src={player.avatarUrl} style={{ margin: '20px calc(50% - 48px)' }} />
        {player.username
          ? (
              <Cell before="Tg username:" onClick={() => openTelegramLink?.(`https://t.me/${player.username}`)}>
                <Text>{player.username}</Text>
              </Cell>
            )
          : <Cell>Не занятый пользователь</Cell>}
        <Cell>
          <Info
            avatarStack={(
              <AvatarStack>
                <Avatar size={28} />
                <Avatar size={28} />
                <Avatar size={28} />
              </AvatarStack>
            )}
            type="avatarStack"
          >
            Достижения
          </Info>
        </Cell>
      </List>
    </Section>
  )
}
