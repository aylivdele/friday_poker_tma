import type { Player } from '@/types/api'
import { Avatar, Cell, Text } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import CrownSvg from '../../../app/_assets/crown.svg'
import './Player.css'

export function GroupPlayer({ player, isOwner, onClick }: { player: Player, isOwner: boolean, onClick?: () => void }) {
  const router = useRouter()

  return (
    <Cell
      onClick={onClick ?? (() => router.push(`/players/${player._id}`))}
      before={(
        <Avatar
          size={48}
          src={player.avatarUrl}
        >
          {isOwner && <CrownSvg alt="Владелец" className="avatar-icon" />}
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
