import type { Achievment } from '@/types/api'
import { Avatar, Cell, List, Steps, Text } from '@telegram-apps/telegram-ui'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Loader } from '@/components/Loader/Loader'
import { isNull, nonNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'

export function Achievments({ progresses }: { progresses?: Pick<Achievment, 'id' | 'progress'>[] }) {
  const swr = useSWR<Omit<Achievment, 'progress'>[]>('/api/achievments', swrGetFetcher)
  const [achievments, setAchievments] = useState<Achievment[]>([])

  useEffect(() => {
    if (Array.isArray(swr.data)) {
      setAchievments(swr.data.map((i) => {
        const progress = progresses?.find(p => p.id === i.id)?.progress ?? [0, i.maxProgress]
        if (i.isSecret && progress[0] !== progress[1]) {
          return null
        }
        return { ...i, progress }
      }).filter(nonNull))
    }
    else {
      setAchievments([])
    }
  }, [swr.data, progresses])

  if (isNull(swr.data)) {
    return (<Loader {...swr} />)
  }

  return (
    <List>
      {
        achievments.map(a => (
          <Cell
            before={(<Avatar size={28} fallbackIcon={(<span>{a.icon}</span>)} />)}
            subtitle={<Text>{a.description}</Text>}
            description={<Steps progress={a.progress[0]} count={a.progress[1]} />}
          >
            {a.name}
          </Cell>
        ))
      }
    </List>
  )
}
