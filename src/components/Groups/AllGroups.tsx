'use client'

import type { Group } from '@/types/api'
import { List } from '@telegram-apps/telegram-ui'
import useSWR from 'swr'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { Loader } from '../Loader/Loader'
import GroupComponent from './Group'

export default async function GroupsAll() {
  const swr = useSWR<Group[]>(`/api/groups`, swrGetFetcher)
  const groups = swr.data

  if (isNull(groups)) {
    return (<Loader {...swr} />)
  }

  return (
    <List>
      {groups?.map(g => (
        <GroupComponent key={g.title} group={g} />
      ))}
    </List>
  )
}
