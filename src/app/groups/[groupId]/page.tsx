'use client'

import type { Group } from '@/types/api'
import { Section } from '@telegram-apps/telegram-ui'
import { use } from 'react'
import useSWR from 'swr'
import { DeleteGroupButton } from '@/components/Groups/DeleteGroupButton'
import { GroupMainContent } from '@/components/Groups/GroupMainConent'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default async function GroupsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use (params)
  const { data: group, isLoading, error, mutate } = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)

  if (!group) {
    return (<Loader isLoading={isLoading} error={error} data={group} />)
  }

  return (
    <Page>
      <Section header={`Группа: ${group?.title}`} footer={(<DeleteGroupButton groupId={groupId} ownerId={group?.ownerId.toString()} />)}>
        <GroupMainContent group={group} mutateGroup={mutate} />
      </Section>
    </Page>
  )
}
