import { Cell, List, Section, TabsList, Text } from '@telegram-apps/telegram-ui'
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem'
import { ObjectId } from 'mongodb'
import { use, useState } from 'react'
import { GroupPlayer } from '@/components/Groups/Player/Player'
import { Link } from '@/components/Link/Link'
import { Page } from '@/components/Page'
import { getDb } from '@/core/db'

export default async function GroupsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const group = await (await getDb()).groups.findOne({ _id: new ObjectId(groupId) })
  const [selectedTab, setSelectedTab] = useState<'players' | 'seasons'>('players')

  if (!group) {
    return (
      <Page>
        <Text>Группа не найдена</Text>
      </Page>
    )
  }

  const seasons = (await (await getDb()).seasons.find({ groupId: group._id }).toArray()).reverse()

  return (
    <Page>
      <Section header={`Группа: ${group.name}`}>
        <TabsList>
          <TabsItem selected={selectedTab === 'players'} onClick={() => setSelectedTab('players')}>
            Игроки
          </TabsItem>
          <TabsItem selected={selectedTab === 'seasons'} onClick={() => setSelectedTab('seasons')}>
            Сезоны
          </TabsItem>
        </TabsList>
        { selectedTab === 'players'
          ? (
              <List>
                {group.members.map(memberId => (
                  <GroupPlayer key={memberId.toString()} id={memberId} isOwner={memberId.equals(group.ownerId)} />
                ))}
              </List>
            )
          : (
              <List>
                {seasons.map(season => (
                  <Link href={`/groups/${groupId}/seasons/${season._id}`} key={season._id.toString()}>
                    <Cell subtitle={`Игр: ${season.gameIds.length}`}>{season.title}</Cell>
                  </Link>
                ))}
              </List>
            ) }
      </Section>
    </Page>
  )
}
