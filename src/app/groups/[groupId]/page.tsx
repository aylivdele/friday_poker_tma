import { Section, Text } from '@telegram-apps/telegram-ui'
import { ObjectId } from 'mongodb'
import { GroupMainContent } from '@/components/Groups/GroupMainConent'
import { Page } from '@/components/Page'
import { getDb } from '@/core/db'

export default async function GroupsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await (params)
  const group = await (await getDb()).groups.findOne({ _id: new ObjectId(groupId) })

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
        <GroupMainContent group={group} seasons={seasons} />
      </Section>
    </Page>
  )
}
