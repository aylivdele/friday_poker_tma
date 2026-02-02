import type { Player } from '@/types/api'
import { Avatar, Cell, Text } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { isNull } from '@/app/api/helpers'
import { Loader } from '@/components/Loader/Loader'
import { swrGetFetcher } from '@/lib/swrFetcher'
import CrownSvg from '../../../app/_assets/crown.svg'
import './Player.css'

export async function GroupPlayer({ id, isOwner }: { id: string, isOwner: boolean }) {
  const swr = useSWR<Player>(`/api/players/${id}`, swrGetFetcher)
  const player = swr.data
  const router = useRouter()

  if (isNull(player)) {
    return (<Loader {...swr} />)
  }

  return (
    <Cell
      onClick={() => router.push(`/players/${player._id}`)}
      before={(
        <Avatar
          size={48}
          src={player.avatarUrl}
        >
          {isOwner && <img src={CrownSvg} alt="Владелец" className="avatar-icon" />}
        </Avatar>
      )}
      after={(
        <Text>
          Побед: TBD
        </Text>
      )}
    >
      {player.firstName}
      {' '}
      {player.lastName}
    </Cell>
  )
}
