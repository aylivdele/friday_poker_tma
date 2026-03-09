import type { Achievment } from '@/types/api'
import { Avatar, Caption, Cell, List } from '@telegram-apps/telegram-ui'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Loader } from '@/components/Loader/Loader'
import { isNull, nonNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { ProgressBar } from '../Progress/ProgressBar'

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
      }).filter(nonNull).sort((a, b) => {
        const procB = (b.progress[0] / b.progress[1])
        const procA = (a.progress[0] / a.progress[1])

        if (a.progress[0] === b.progress[0]) {
          return procB - procA
        }
        if (procA === 1) {
          return -1
        }
        if (procB === 1) {
          return 1
        }
        return b.progress[0] - a.progress[0]
      }))
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
            before={a.icon.startsWith('data:image/') ? (<Avatar src={a.icon} size={40} />) : (<span style={{ fontSize: '40px', opacity: a.progress[0] === a.progress[1] ? 1 : 0.65 }}>{a.icon}</span>)}
            subtitle={<Caption level="2">{a.description}</Caption>}
            description={(<ProgressBar count={a.progress[1]} progress={a.progress[0]} />)}
          >
            {a.name}
          </Cell>
        ))
      }
    </List>
  )
}
