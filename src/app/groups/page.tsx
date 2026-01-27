import type { Group } from '@/types/types'
import { Cell, FixedLayout, Section, Spinner, Tabbar, Text } from '@telegram-apps/telegram-ui'
import { useEffect, useState } from 'react'

export function groupsPage() {
  const [groups, setGroups] = useState<Array<Group> | undefined>(undefined)

  useEffect(() => {

  }, [])

  if (groups === undefined) {
    return <Cell before={<Spinner size="m" />}><Text weight="2">Загрузка данных игрока...</Text></Cell>
  }

  if (groups === null) {
    return <Text weight="2">Ошибка при загрузке групп. Попробуйте перезагрузить страницу.</Text>
  }

  return (
    <Section header="Группы">
    </Section>
  )
}
