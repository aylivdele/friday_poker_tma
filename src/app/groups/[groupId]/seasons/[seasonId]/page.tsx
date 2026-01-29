import { Cell, List, Section, Text } from '@telegram-apps/telegram-ui'
import { ObjectId } from 'mongodb'
import { NewGameButton } from '@/components/Games/NewGameButton'
import { Link } from '@/components/Link/Link'
import { Page } from '@/components/Page'
import { getDb } from '@/core/db'

export default async function SeasonPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params
  const season = await (await getDb()).seasons.findOne({ _id: new ObjectId(seasonId) })
  if (!season) {
    return (
      <Page>
        <Text>Сезон не найден</Text>
      </Page>
    )
  }

  const games = await (await getDb()).games.find({ _id: { $in: season.gameIds } }).toArray()
  const group = await (await getDb()).groups.findOne({ _id: season.groupId })

  return (
    <Page>
      <Section header={`Сезон: ${season.title}`}>
        <Section header="Игры">
          <NewGameButton groupMembers={group?.members.map(m => m.toString()) ?? []} games={games.length} seasonId={season._id.toString()} groupId={group?._id.toString()} />
          {games.length === 0
            ? (
                <Text>Игры не найдены</Text>
              )
            : (
                <List>
                  {
                    games.map(game => (
                      <Link href={`/games/${game._id}`} key={game._id.toString()}>
                        <Cell after={game.isFinished ? '' : 'В процессе'} subtitle={`Кол-во игроков: ${game.players.length}`}>{game.title}</Cell>
                      </Link>
                    ))
                  }
                </List>
              )}
        </Section>
      </Section>
    </Page>
  )
}
