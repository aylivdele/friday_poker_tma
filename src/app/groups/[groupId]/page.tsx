'use client'

import type { Group } from '@/types/api'
import { Section } from '@telegram-apps/telegram-ui'
import { use } from 'react'
import useSWR from 'swr'
import { BottomGroupButton } from '@/components/Groups/DeleteGroupButton'
import { GroupMainContent } from '@/components/Groups/GroupMainConent'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function GroupsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use (params)
  const { data: group, isLoading, error, mutate } = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)

  if (!group) {
    return (<Loader isLoading={isLoading} error={error} data={group} />)
  }

  return (
    <Page>
      <Section style={{ minHeight: '100%' }} header={`Группа: ${group?.title}`} footer={(<BottomGroupButton members={group.members} groupId={groupId} ownerId={group?.ownerId.toString()} />)}>
        <GroupMainContent group={group} mutateGroup={mutate} />
      </Section>
    </Page>
  )
}
