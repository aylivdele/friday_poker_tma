'use client'

import type { Game } from '@/types/api'
import { Cell, List, Section, Text } from '@telegram-apps/telegram-ui'
import router from 'next/router'
import useSWR from 'swr'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function GamesPage() {
  const swr = useSWR<Game[]>(`/api/games?useInitData=true`, swrGetFetcher)
  const games = swr.data

  if (isNull(games)) {
    return <Loader {...swr} />
  }
  return (
    <Page back={false}>
      <Section header="Последние игры">

        {games.length === 0
          ? (
              <Cell>
                <Text>Игры не найдены</Text>
              </Cell>
            )
          : (
              <List>
                {
                  games.sort((a, b) => a.createdAt - b.createdAt).map(game => (
                    <Cell
                      onClick={() => router.push(`/groups/${game.groupId}/seasons/${game.seasonId}/games/${game._id}`)}
                      after={game.isFinished ? '' : (<Text>В процессе</Text>)}
                      subtitle={(
                        <Text>
                          Кол-во игроков:
                          {game.players.length}
                        </Text>
                      )}
                    >
                      <Text>{game.title}</Text>
                    </Cell>
                  ))
                }
              </List>
            )}
      </Section>
    </Page>
  )
}
