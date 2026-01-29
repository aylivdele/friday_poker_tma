import { List } from '@telegram-apps/telegram-ui'
import { getDb } from '@/core/db'
import GroupComponent from './Group'

export default async function GroupsAll() {
  const groups = await (await getDb()).groups.find({}).toArray()

  return (
    <List>
      {groups?.map(g => (
        <GroupComponent key={g.name} group={g} />
      ))}
    </List>
  )
}
