'use client'

import type { GameDetails, GameSettings, Player } from '@/types/api'
import { useState } from 'react'
import { toast } from 'sonner'
import { ActionBar, ActionButton, ActionHint } from '@/components/ActionBar/ActionBar'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { Section } from '@/components/app/Section'
import { Stepper } from '@/components/app/Stepper'
import { totalStacks } from '@/domain/balances'
import { useClosingConfirmation } from '@/hooks/useClosingConfirmation'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { playerName } from '@/lib/format'
import { haptic } from '@/lib/haptics'
import { SettingsFields } from './SettingsFields'

interface Draft {
  players: { playerId: string, entries: number }[]
  scores: Record<string, number>
  settings: GameSettings
}

function draftOf(game: GameDetails): Draft {
  return {
    players: game.players.map(p => ({ ...p })),
    scores: Object.fromEntries((game.results ?? []).map(r => [r.playerId, r.score])),
    settings: { ...game.settings },
  }
}

// Исправление завершённой игры: черновик сохраняется только кнопкой, после проверки стеков
export function CorrectionEditor({ game, playersById, onSaved, onCancel }: {
  game: GameDetails
  playersById: Map<string, Player>
  onSaved: (game: GameDetails) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(game))
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(game))
  useClosingConfirmation(dirty)

  const total = totalStacks(draft)
  const distributed = draft.players.reduce((acc, p) => acc + (draft.scores[p.playerId] ?? 0), 0)
  const invalid = Object.values(invalidFields).some(Boolean)
  const problem = invalid
    ? 'Заполните пустые поля'
    : distributed !== total ? `Стеков в игре ${total}, в итогах ${distributed} — должно совпадать` : null

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.put<GameDetails>(`/api/games/${game._id}`, {
        rev: game.rev,
        players: draft.players,
        settings: draft.settings,
        results: draft.players.map(p => ({ playerId: p.playerId, score: draft.scores[p.playerId] ?? 0 })),
      })
      haptic('success')
      toast.success('Итоги исправлены')
      onSaved(updated)
    }
    catch (e) {
      haptic('error')
      toast.error(getErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <>
      <Section title="Входы и стеки" footer={`Стеков в игре: ${total} · в итогах: ${distributed}`}>
        {draft.players.map((p, index) => {
          const info = playersById.get(p.playerId)
          const score = draft.scores[p.playerId] ?? 0
          return (
            <div key={p.playerId} className="flex flex-col gap-2 px-3.5 py-3">
              <div className="flex items-center gap-3">
                <PlayerAvatar player={info} className="size-8" />
                <span className="truncate text-base font-medium">{playerName(info)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between gap-1 rounded-xl bg-muted/60 py-1 pr-1 pl-3">
                  <span className="text-[13px] text-muted-foreground">Входы</span>
                  <Stepper
                    label={`входы ${playerName(info)}`}
                    value={p.entries + 1}
                    min={1}
                    onChange={total => setDraft({ ...draft, players: draft.players.map((x, i) => i === index ? { ...x, entries: total - 1 } : x) })}
                  />
                </div>
                <div className="flex items-center justify-between gap-1 rounded-xl bg-muted/60 py-1 pr-1 pl-3">
                  <span className="text-[13px] text-muted-foreground">Стеки</span>
                  <Stepper
                    label={`стеки ${playerName(info)}`}
                    value={score}
                    onChange={value => setDraft({ ...draft, scores: { ...draft.scores, [p.playerId]: value } })}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </Section>

      <Section title="Настройки">
        <SettingsFields
          settings={draft.settings}
          seasonId={game.seasonId}
          onChange={patch => setDraft({ ...draft, settings: { ...draft.settings, ...patch } })}
          onInvalidChange={(field, value) => setInvalidFields(prev => ({ ...prev, [field]: value }))}
        />
      </Section>

      <ActionBar>
        {dirty && problem && <ActionHint>{problem}</ActionHint>}
        <ActionButton disabled={!dirty || !!problem} loading={saving} onClick={save}>Сохранить изменения</ActionButton>
        <ActionButton variant="secondary" disabled={saving} onClick={onCancel}>Отмена</ActionButton>
      </ActionBar>
    </>
  )
}
