'use client'

import type { Season } from '@/types/api'
import { Section, TabsList } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { confirmAction } from '@/components/ConfirmButton/ConfirmButton'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { SeasonGames } from '@/components/Seasons/SeasonGames'
import { SeasonTable } from '@/components/Seasons/SeasonTable'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function SeasonPage({ params }: { params: Promise<{ seasonId: string, groupId: string }> }) {
  const { seasonId, groupId } = use(params)
  const seasonSwr = useSWR<Season>(`/api/seasons/${seasonId}`, swrGetFetcher)
  const season = seasonSwr.data
  const [selectedTab, setSelectedTab] = useState<'games' | 'table'>('games')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!season) {
      return
    }
    const gamesCount = season.gameIds.length
    const confirmed = await confirmAction({
      title: 'Удалить сезон?',
      description: gamesCount > 0
        ? `Вместе с сезоном будут удалены все его игры (${gamesCount}). Это нельзя отменить.`
        : 'Это нельзя отменить.',
      confirmText: 'Удалить',
    })
    if (!confirmed) {
      return
    }
    setDeleting(true)
    try {
      await api.delete(`/api/seasons/${seasonId}`)
      toast.success('Сезон удалён')
      router.replace(`/groups/${groupId}`)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
      setDeleting(false)
    }
  }

  if (isNull(season)) {
    return (
      <Page>
        <Loader {...seasonSwr} />
      </Page>
    )
  }

  return (
    <Page>
      <Section header={`Сезон: ${season.title}`}>
        <TabsList>
          <TabsList.Item selected={selectedTab === 'games'} onClick={() => setSelectedTab('games')}>
            Игры
          </TabsList.Item>
          <TabsList.Item selected={selectedTab === 'table'} onClick={() => setSelectedTab('table')}>
            Таблица
          </TabsList.Item>
        </TabsList>
        {
          selectedTab === 'games'
            ? (<SeasonGames seasonId={seasonId} />)
            : (<SeasonTable seasonId={seasonId} />)
        }
      </Section>

      <ActionBar>
        {season.can.createGame && selectedTab === 'games' && (
          <ActionButton onClick={() => router.push(`/groups/${groupId}/seasons/${seasonId}/games/new`)}>Новая игра</ActionButton>
        )}
        {season.can.delete && (
          <ActionButton variant="destructive" loading={deleting} onClick={handleDelete}>Удалить сезон</ActionButton>
        )}
      </ActionBar>
    </Page>
  )
}
