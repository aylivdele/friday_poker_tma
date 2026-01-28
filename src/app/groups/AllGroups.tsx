import { Avatar, Badge, Cell, List } from '@telegram-apps/telegram-ui'
import { getDb } from '@/core/db'

export default async function GroupsAll() {
  const groups = await (await getDb()).groups.find({}).toArray()

  return (
    <List>
      {groups?.map(g => (
        <Cell
          key={g.name}
          before={<Avatar size={48} />}
          after={<Badge type="number">{g.members.length}</Badge>}
          interactiveAnimation="background"
        >
          {g.name}
        </Cell>
      ))}
    </List>
  )
}
