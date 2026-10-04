'use client'

import type { Game, GameSettings } from '@/types/api'
import { useId } from 'react'
import useSWR from 'swr'
import { NumberField } from '@/components/app/NumberField'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_FUND_PERCENT, seasonFundCollected } from '@/domain/balances'
import { formatMoney, plural } from '@/lib/format'
import { swrGetFetcher } from '@/lib/swrFetcher'

export function settingsSummary(settings: GameSettings) {
  const extra = settings.isFinal
    ? settings.prizeFund ? ` · фонд ${formatMoney(settings.prizeFund)}` : ''
    : ` · в фонд ${settings.fundPercent ?? DEFAULT_FUND_PERCENT}%`
  return `Вход ${formatMoney(settings.firstEntryCost)} · докуп ${formatMoney(settings.reEntryCost)} · до ${plural(settings.maxReEntries, ['докупа', 'докупов', 'докупов'])}${extra}`
}

// Сколько собрано в фонд за сезон — подсказка для поля фонда финала
export function useSeasonFundCollected(seasonId: string | undefined, enabled: boolean) {
  const { data: games } = useSWR<Game[]>(enabled && seasonId ? `/api/games?seasonId=${seasonId}` : null, swrGetFetcher)
  return games ? Math.round(seasonFundCollected(games)) : undefined
}

// Поля настроек игры; используются в шторке идущей игры, в форме новой игры и при исправлении
export function SettingsFields({ settings, seasonId, onChange, onInvalidChange, disabled }: {
  settings: GameSettings
  // для подсказки, сколько собрано в фонд за сезон
  seasonId?: string
  onChange: (patch: Partial<GameSettings>) => void
  onInvalidChange?: (field: string, invalid: boolean) => void
  disabled?: boolean
}) {
  const finalId = useId()
  const collected = useSeasonFundCollected(seasonId, settings.isFinal)
  const fund = settings.prizeFund ?? 0

  return (
    <div className="divide-y">
      <label htmlFor={finalId} className="flex min-h-14 items-center gap-3 px-3.5 py-2">
        <span className="flex flex-1 flex-col">
          <span className="text-base">Финал сезона</span>
          <span className="text-[13px] text-muted-foreground">Входы зависят от того, сколько игрок сыграл за сезон</span>
        </span>
        <Switch id={finalId} checked={settings.isFinal} disabled={disabled} onCheckedChange={isFinal => onChange({ isFinal })} />
      </label>
      {settings.isFinal && (
        <div>
          <NumberField label="Призовой фонд" suffix="₽" value={fund} max={10_000_000} disabled={disabled} onChange={prizeFund => onChange({ prizeFund })} onInvalidChange={invalid => onInvalidChange?.('prizeFund', invalid)} />
          {collected !== undefined && (
            <div className="flex items-center gap-2 px-3.5 pb-2.5 text-[13px] text-muted-foreground">
              <span className="flex-1">{`Собрано с игр сезона: ${formatMoney(collected)}. С процентами по вкладу может быть больше`}</span>
              {collected !== fund && !disabled && (
                <Button variant="ghost" className="h-8 shrink-0 rounded-lg px-2 text-[13px] text-primary-text hover:bg-secondary hover:text-primary-text" onClick={() => onChange({ prizeFund: collected })}>
                  Подставить
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <NumberField label="Стоимость входа" suffix="₽" value={settings.firstEntryCost} max={1_000_000} disabled={disabled} onChange={firstEntryCost => onChange({ firstEntryCost })} onInvalidChange={invalid => onInvalidChange?.('firstEntryCost', invalid)} />
      <NumberField label="Стоимость докупа" suffix="₽" value={settings.reEntryCost} max={1_000_000} disabled={disabled} onChange={reEntryCost => onChange({ reEntryCost })} onInvalidChange={invalid => onInvalidChange?.('reEntryCost', invalid)} />
      <NumberField label="Макс. докупов" value={settings.maxReEntries} max={100} disabled={disabled} onChange={maxReEntries => onChange({ maxReEntries })} onInvalidChange={invalid => onInvalidChange?.('maxReEntries', invalid)} />
      {!settings.isFinal && (
        <NumberField label="В призовой фонд" suffix="%" value={settings.fundPercent ?? DEFAULT_FUND_PERCENT} max={100} disabled={disabled} onChange={fundPercent => onChange({ fundPercent })} onInvalidChange={invalid => onInvalidChange?.('fundPercent', invalid)} />
      )}
    </div>
  )
}
