'use client'

import type { GameSettings } from '@/types/api'
import { useId } from 'react'
import { NumberField } from '@/components/app/NumberField'
import { Switch } from '@/components/ui/switch'
import { formatMoney, plural } from '@/lib/format'

export function settingsSummary(settings: GameSettings) {
  return `Вход ${formatMoney(settings.firstEntryCost)} · докуп ${formatMoney(settings.reEntryCost)} · до ${plural(settings.maxReEntries, ['докупа', 'докупов', 'докупов'])}`
}

// Поля настроек игры; используются в шторке идущей игры, в форме новой игры и при исправлении
export function SettingsFields({ settings, onChange, onInvalidChange, disabled }: {
  settings: GameSettings
  onChange: (patch: Partial<GameSettings>) => void
  onInvalidChange?: (field: string, invalid: boolean) => void
  disabled?: boolean
}) {
  const finalId = useId()
  return (
    <div className="divide-y">
      <label htmlFor={finalId} className="flex min-h-14 items-center gap-3 px-3.5 py-2">
        <span className="flex flex-1 flex-col">
          <span className="text-base">Финал сезона</span>
          <span className="text-[13px] text-muted-foreground">Входы зависят от того, сколько игрок сыграл за сезон</span>
        </span>
        <Switch id={finalId} checked={settings.isFinal} disabled={disabled} onCheckedChange={isFinal => onChange({ isFinal })} />
      </label>
      <NumberField label="Стоимость входа" suffix="₽" value={settings.firstEntryCost} max={1_000_000} disabled={disabled} onChange={firstEntryCost => onChange({ firstEntryCost })} onInvalidChange={invalid => onInvalidChange?.('firstEntryCost', invalid)} />
      <NumberField label="Стоимость докупа" suffix="₽" value={settings.reEntryCost} max={1_000_000} disabled={disabled} onChange={reEntryCost => onChange({ reEntryCost })} onInvalidChange={invalid => onInvalidChange?.('reEntryCost', invalid)} />
      <NumberField label="Макс. докупов" value={settings.maxReEntries} max={100} disabled={disabled} onChange={maxReEntries => onChange({ maxReEntries })} onInvalidChange={invalid => onInvalidChange?.('maxReEntries', invalid)} />
    </div>
  )
}
