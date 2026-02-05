'use client'

import { Section, TabsList } from '@telegram-apps/telegram-ui'
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem'
import { mainButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Page } from '@/components/Page'
import AllGroups from '../../components/Groups/AllGroups'
import MyGroups from '../../components/Groups/MyGroups'

export default function groupsPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'my'>('all')
  const router = useRouter()

  useEffect(() => {
    if (!mainButton)
      return

    mainButton.setText('Создать группу')
    mainButton.show()
    const unbound = mainButton.onClick(() => router.push(`/groups/new`))

    return () => {
      unbound()
      mainButton.hide()
    }
  }, [mainButton])

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
    </Page>
  )
}
