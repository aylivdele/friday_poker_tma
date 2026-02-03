import type { Player } from '@/types/api'
import { Avatar, AvatarStack, Info, List, Section, Text } from '@telegram-apps/telegram-ui'

export function PlayerComponent({ player }: { player: Player }) {
  return (
    <Section header={`Профиль: ${player.firstName} ${player.lastName}`}>
      <List>
        <Avatar size={96} src={player.avatarUrl} />
        <Text>
          username:
          {' '}
          {player.username}
        </Text>
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
      </List>
    </Section>
  )
}
