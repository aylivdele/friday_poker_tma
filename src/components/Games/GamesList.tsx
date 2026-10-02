import type { Game } from '@/types/api'
import { Badge, Cell, List, Text } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'

// Игры приходят с сервера уже отсортированными: новые сверху
export function GamesList({ games }: { games: Game[] }) {
  const router = useRouter()

  if (games.length === 0) {
    return (
      <Cell>
        <Text>Игры не найдены</Text>
      </Cell>
    )
  }

  return (
    <List>
      {games.map(game => (
        <Cell
          key={game._id}
          onClick={() => router.push(`/groups/${game.groupId}/seasons/${game.seasonId}/games/${game._id}`)}
          after={game.isFinished ? undefined : <Badge type="number" mode="secondary">идёт</Badge>}
          subtitle={`Игроков: ${game.players.length}`}
          subhead={game.settings.isFinal ? 'Финал' : undefined}
        >
          {game.title}
        </Cell>
      ))}
    </List>
  )
}
