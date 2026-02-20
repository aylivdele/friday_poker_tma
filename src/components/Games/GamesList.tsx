import type { Game } from '@/types/api'
import { Cell, Headline, List, Text } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'

export function GamesList({ games }: { games: Game[] }) {
  const router = useRouter()

  return (
    games.length === 0
      ? (
          <Cell>
            <Text>Игры не найдены</Text>
          </Cell>
        )
      : (
          <List>
            {
              games.sort((a, b) => b.createdAt - a.createdAt).map(game => (
                <Cell
                  onClick={() => router.push(`/groups/${game.groupId}/seasons/${game.seasonId}/games/${game._id}`)}
                  after={game.isFinished ? '' : (<Text>В процессе</Text>)}
                  subtitle={(
                    <Text>
                      Кол-во игроков:
                      {game.players.length}
                    </Text>
                  )}
                  subhead={
                    game.settings.isFinal ? (<Headline>Финальная</Headline>) : undefined
                  }
                >
                  <Text>{game.title}</Text>
                </Cell>
              ))
            }
          </List>
        )
  )
}
