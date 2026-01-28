import { Cell, Spinner, Text } from '@telegram-apps/telegram-ui'
import { Page } from '@/components/Page'

export default function Root() {
  return (
    <Page back={false}>
      <Cell before={<Spinner size="m" />}><Text weight="2">Загрузка...</Text></Cell>
    </Page>
  )
}
