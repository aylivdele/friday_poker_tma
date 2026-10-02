'use client'

import { Section, TabsList } from '@telegram-apps/telegram-ui'
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { Page } from '@/components/Page'
import AllGroups from '../../components/Groups/AllGroups'
import MyGroups from '../../components/Groups/MyGroups'

export default function GroupsPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'my'>('all')
  const router = useRouter()

  return (
    <Page back={false}>
      <Section header="Группы">
        <TabsList>
          <TabsItem selected={selectedTab === 'all'} onClick={() => setSelectedTab('all')}>
            Все группы
          </TabsItem>
          <TabsItem selected={selectedTab === 'my'} onClick={() => setSelectedTab('my')}>
            Мои группы
          </TabsItem>
        </TabsList>
        { selectedTab === 'all' ? <AllGroups /> : (<MyGroups />) }
      </Section>
      <ActionBar>
        <ActionButton onClick={() => router.push('/groups/new')}>Создать группу</ActionButton>
      </ActionBar>
    </Page>
  )
}
