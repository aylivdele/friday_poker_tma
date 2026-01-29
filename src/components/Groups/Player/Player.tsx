import type { ObjectId } from 'mongodb'
import { Avatar, Cell, Text } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/router'
import { getDb } from '@/core/db'
import './Player.css'
import CrownSvg from '/public/crown.svg'

export async function GroupPlayer({ id, isOwner }: { id: ObjectId, isOwner: boolean }) {
  const player = await (await getDb()).players.findOne({ _id: id })
  const router = useRouter()
  if (!player) {
    return <Text>Игрок не найден</Text>
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
