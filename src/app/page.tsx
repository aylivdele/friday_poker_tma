import type { Group, Player } from '@/types/types'
import { initData, useSignal } from '@tma.js/sdk-react'
import { useEffect, useState } from 'react'
import { api } from './api/client'
import { nonNull } from './api/helpers'

export default function Root() {
  const initDataUser = useSignal(initData.user)
  const [player, setPlayer] = useState<Player | undefined>()
  const [groups, setGroups] = useState<Array<Group>>([])

  useEffect(() => {
    if (!initDataUser) {
      setPlayer(undefined)
      return
    }
    api.get<Player>(`/api/players?telegramId=true`).then((res) => {
      setPlayer(res)
      if (nonNull(res._id)) {
        api.get<Array<Group>>(`/api/groups?playerId=${res._id}`).then((grs) => {
          setGroups(grs)
        })
      }
    })
  }, [initDataUser])

  return <></>
}
