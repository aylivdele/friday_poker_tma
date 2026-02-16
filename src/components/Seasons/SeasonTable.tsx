'use client'

import type { SeasonTableResponse } from '@/types/api'
import { Section } from '@telegram-apps/telegram-ui'
import useSWR from 'swr'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { Loader } from '../Loader/Loader'
import './SeasonTable.css'

export function SeasonTable({ seasonId }: { seasonId: string }) {
  const swr = useSWR<SeasonTableResponse>(`/api/seasons/${seasonId}/results`, swrGetFetcher)
  const data = swr.data

  if (isNull(data)) {
    return <Loader {...swr} />
  }

  return (
    <Section header="Таблица">
      <div className="container">
        <div className="grid-table" style={{ gridTemplateColumns: `160px repeat(${data.games.length}, minmax(80px, 1fr)) 110px` }}>
          <div className="sticky-col header">Игрок</div>

          {data.games.map(g => (
            <div key={g._id} className="header">
              {g.isFinal && <span className="ml-1">🏆</span>}
              {g.title}
            </div>
          ))}

          <div className="header total">Итого</div>

          {data.players.map((player) => {
            const total = data.totals[player._id]
            const place = data.seasonPlaces[player._id]
            const isFinalWinner = data.finalWinners.includes(player._id)

            return (
              <>
                <div className="sticky-col player">
                  {player.firstName}
                  {' '}
                  {player.lastName?.substring(0, 3)?.concat('.') ?? ''}

                  {isFinalWinner && <span className="ml-1">🏆</span>}

                  {place === 1 && <span className="ml-1">🥇</span>}
                  {place === 2 && <span className="ml-1">🥈</span>}
                  {place === 3 && <span className="ml-1">🥉</span>}
                </div>

                {data.games.map((game) => {
                  const value = data.cells[player._id]?.[game._id] ?? 0

                  return (
                    <div
                      key={game._id}
                      className={`cell ${
                        value > 0 ? 'win' : value < 0 ? 'lose' : ''
                      }`}
                    >
                      {value}
                    </div>
                  )
                })}

                <div className="cell total">
                  {total}
                </div>
              </>
            )
          })}

        </div>
      </div>

    </Section>
  )
}
