import type { PropsWithChildren } from 'react'
import { Cell, Spinner, Text } from '@telegram-apps/telegram-ui'
import { isNull } from '@/app/api/helpers'

export function Loader({ data, isLoading, error, children }: PropsWithChildren<{ data: any, isLoading: boolean, error: any }>) {
  if (isLoading)
    return (<Cell before={<Spinner size="m" />}><Text weight="2">Загрузка...</Text></Cell>)
  if (error) {
    return (
      <Text weight="2">
        Ошибка загрузки:
        {error}
      </Text>
    )
  }
  if (isNull(data)) {
    return (
      <Text weight="2">
        Не найдено
      </Text>
    )
  }
  return children
}
