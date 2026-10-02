'use client'

import type { Group } from '@/types/api'
import { Section } from '@telegram-apps/telegram-ui'
import { use } from 'react'
import useSWR from 'swr'
import { GroupMainContent } from '@/components/Groups/GroupMainConent'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const { data: group, isLoading, error, mutate } = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)

  if (!group) {
    return (
      <Page>
        <Loader isLoading={isLoading} error={error} data={group} />
      </Page>
    )
  }

  return (
    <Page>
      <Section header={`Группа: ${group.title}`}>
        <GroupMainContent group={group} mutateGroup={mutate} />
      </Section>
    </Page>
  )
}
