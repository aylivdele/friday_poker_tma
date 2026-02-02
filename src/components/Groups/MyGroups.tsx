'use client'

import type { Group } from '@/types/api'
import { List } from '@telegram-apps/telegram-ui'
import useSWR from 'swr'
import { isNull } from '@/app/api/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { Loader } from '../Loader/Loader'
import GroupComponent from './Group'

export default function GroupsClient() {
  const swr = useSWR<Group[]>(
    '/api/groups?useInitData=true',
    swrGetFetcher,
  )
  const data = swr.data

  if (isNull(data)) {
    return (<Loader {...swr} />)
  }

  return (
    <List>
      {data.map(g => (
        <GroupComponent key={g.title} group={g} />
      ))}
    </List>
  )
}
