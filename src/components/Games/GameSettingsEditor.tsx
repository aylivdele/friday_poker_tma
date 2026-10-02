'use client'

import type { GameSettings } from '@/types/api'
import {
  Cell,
  Section,
  Subheadline,
  Switch,
} from '@telegram-apps/telegram-ui'
import { useEffect, useState } from 'react'
import { NumberInput } from '../NumberInput/NumberInput'

type NumberField = 'firstEntryCost' | 'reEntryCost' | 'maxReEntries'

const numberFields: { key: NumberField, label: string }[] = [
  { key: 'firstEntryCost', label: 'Стоимость первого входа' },
  { key: 'reEntryCost', label: 'Стоимость повторного входа' },
  { key: 'maxReEntries', label: 'Макс. повторных входов' },
]

export default function GameSettingsEditor({
  gameSettings,
  editable,
  onChange,
  onValidityChange,
}: {
  gameSettings: GameSettings
  editable: boolean
  onChange: (gameSettings: GameSettings) => void
  // false, пока хотя бы одно числовое поле пустое
  onValidityChange?: (valid: boolean) => void
}) {
  const [invalidFields, setInvalidFields] = useState<Partial<Record<NumberField, boolean>>>({})
  const valid = !Object.values(invalidFields).some(Boolean)

  useEffect(() => {
    onValidityChange?.(valid)
  }, [valid])

  function updateSettings(patch: Partial<GameSettings>) {
    onChange({
      ...gameSettings,
      ...patch,
    })
  }

  return (
    <Section header="Настройки игры">
      <Cell
        Component="label"
        after={(
          <Switch
            checked={gameSettings.isFinal}
            disabled={!editable}
            onChange={e =>
              updateSettings({
                isFinal: e.target.checked,
              })}
          />
        )}
      >
        Финальная игра сезона
      </Cell>

      {numberFields.map(({ key, label }) => (
        <NumberInput
          key={key}
          before={<Subheadline level="1">{label}</Subheadline>}
          className="input"
          value={gameSettings[key]}
          disabled={!editable}
          onChange={value => updateSettings({ [key]: value })}
          onInvalidChange={invalid => setInvalidFields(prev => ({ ...prev, [key]: invalid }))}
        />
      ))}
    </Section>
  )
}
