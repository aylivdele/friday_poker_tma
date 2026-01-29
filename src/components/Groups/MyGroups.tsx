'use client'

import type { Group } from '@/types/db'
import { Cell, List, Spinner, Text } from '@telegram-apps/telegram-ui'
import useSWR from 'swr'
import { swrGetFetcher } from '@/lib/swrFetcher'
import GroupComponent from './Group'

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
        <GroupComponent key={g.name} group={g} />
      ))}
    </List>
  )
}
