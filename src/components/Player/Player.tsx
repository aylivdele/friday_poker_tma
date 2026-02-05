import type { Player } from '@/types/api'
import { Avatar, AvatarStack, Cell, Info, List, Section, Text } from '@telegram-apps/telegram-ui'
import { Link } from '../Link/Link'

export function PlayerComponent({ player }: { player: Player }) {
  return (
    <Section header={`Профиль: ${player.firstName} ${player.lastName}`}>
      <List>
        <Avatar size={96} src={player.avatarUrl} style={{ margin: '10% calc(50% - 48px)' }} />
        {player.username
          ? (
              <Cell before="Tg username:">
                <Link href={`https://t.me/${player.username}`}>{player.username}</Link>
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
