import type { Player } from '@/types/api'
import { Avatar, Cell, Headline, List, Section, Text } from '@telegram-apps/telegram-ui'
import { openTelegramLink } from '@tma.js/sdk-react'
import { Achievments } from './Achievments'

export function PlayerComponent({ player }: { player: Player }) {
  return (
    <List>
      <Section header="Профиль игрока">
        <List>
          <Avatar size={96} src={player.avatarUrl} style={{ margin: '20px calc(50% - 48px)' }} />
          <Cell
            onClick={() => player.username && openTelegramLink?.(`https://t.me/${player.username}`)}
            subtitle={(
              <Text Component="a">
                @
                {player.telegramId ? player.username : 'Не занятый пользователь'}
              </Text>
            )}
          >
            <Headline>
              {player.firstName ?? ''}
              {' '}
              {player.lastName ?? ''}
            </Headline>
          </Cell>
        </List>
      </Section>
      <Section header="Достижения">
        <Achievments progresses={player.achievments} />
      </Section>
    </List>
  )
}
