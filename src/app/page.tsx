import { Cell, Spinner, Text } from '@telegram-apps/telegram-ui'

export default function Root() {
  return <Cell before={<Spinner size="m" />}><Text weight="2">Загрузка...</Text></Cell>
}
