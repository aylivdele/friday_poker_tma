'use client'

import type { Group } from '@/types/api'
import { ChevronRightIcon, PlusIcon, SearchIcon, UsersRoundIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { GroupAvatar } from '@/components/app/GroupAvatar'
import { EmptyRow, Row, RowText, Section } from '@/components/app/Section'
import { TabHeader } from '@/components/app/TabHeader'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { plural } from '@/lib/format'
import { swrGetFetcher } from '@/lib/swrFetcher'

function GroupRows({ groups }: { groups: Group[] }) {
  const router = useRouter()
  return groups.map(group => (
    <Row key={group._id} onClick={() => router.push(`/groups/${group._id}`)}>
      <GroupAvatar group={group} />
      <RowText
        title={group.title}
        subtitle={[
          plural(group.members.length, ['участник', 'участника', 'участников']),
          group.can.delete ? 'вы владелец' : group.can.join ? 'вы не участник' : null,
        ].filter(Boolean).join(' · ')}
      />
      <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
    </Row>
  ))
}

export default function GroupsPage() {
  const router = useRouter()
  const mine = useSWR<Group[]>('/api/groups?mine=1', swrGetFetcher)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const found = useSWR<Group[]>(debounced ? `/api/groups?search=${encodeURIComponent(debounced)}` : null, swrGetFetcher)

  return (
    <Page back={false}>
      <TabHeader
        title="Группы"
        action={(
          <Button size="icon" variant="secondary" className="size-11 rounded-full" aria-label="Создать группу" onClick={() => router.push('/groups/new')}>
            <PlusIcon className="size-[22px]" strokeWidth={2.4} />
          </Button>
        )}
      />

      <div className="relative px-4 pt-3">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-7 mt-1.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          inputMode="search"
          className="h-11 rounded-xl bg-card pl-9 text-base"
          placeholder="Найти группу по названию"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {debounced
        ? (
            <Section title="Найдено">
              {!found.data
                ? <Loader {...found} />
                : found.data.length === 0
                  ? <EmptyRow>Ничего не нашлось</EmptyRow>
                  : <GroupRows groups={found.data} />}
            </Section>
          )
        : !mine.data
            ? <Loader {...mine} />
            : mine.data.length === 0
              ? (
                  <div className="flex flex-col items-center gap-3 px-8 pt-14 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                      <UsersRoundIcon className="size-7" />
                    </span>
                    <p className="text-lg font-semibold">Вы пока не в группе</p>
                    <p className="text-sm text-muted-foreground">Найдите группу друзей поиском и вступите по PIN или создайте свою</p>
                    <Button size="lg" className="mt-2 h-11 rounded-xl px-5 text-base" onClick={() => router.push('/groups/new')}>Создать группу</Button>
                  </div>
                )
              : (
                  <Section title="Мои группы">
                    <GroupRows groups={mine.data} />
                  </Section>
                )}
    </Page>
  )
}
