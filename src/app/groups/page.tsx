import { Section, TabsList } from '@telegram-apps/telegram-ui'
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem'
import { useState } from 'react'
import AllGroups from '../../components/Groups/AllGroups'
import MyGroups from '../../components/Groups/MyGroups'

export default function groupsPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'my'>('all')

  return (
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
  )
}
