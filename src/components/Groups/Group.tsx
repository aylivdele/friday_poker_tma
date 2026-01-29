import type { Group } from '@/types/db'
import { Avatar, Badge, Cell } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/router'

export default function GroupComponent({ group }: { group: Group }) {
  const router = useRouter()
  return (
    <Cell
      key={group.name}
      before={<Avatar size={48} />}
      after={<Badge type="number">{group.members.length}</Badge>}
      interactiveAnimation="background"
      onClick={() => router.push(`/groups/${group._id}`)}
    >
      {group.name}
    </Cell>
  )
}
