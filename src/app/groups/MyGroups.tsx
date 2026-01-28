'use client'

import type { Group } from '@/types/types'
import { Avatar, Badge, Cell, List, Spinner, Text } from '@telegram-apps/telegram-ui'
import useSWR from 'swr'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function GroupsClient() {
  const { data, error, isLoading } = useSWR<Group[]>(
    '/api/groups?useInitData=true',
    swrGetFetcher,
  )

  if (isLoading)
    return <Cell before={<Spinner size="m" />}><Text weight="2">Загрузка...</Text></Cell>
  if (error)
    return <Text>Ошибка загрузки</Text>

  return (
    <List>
      {data?.map(g => (
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
