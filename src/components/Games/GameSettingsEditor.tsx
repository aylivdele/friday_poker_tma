'use client'

import type { GameSettings } from './../../types/db'
import {
  Cell,
  Section,
  Subheadline,
  Switch,
} from '@telegram-apps/telegram-ui'
import { NumberInput } from '../NumberInput/NumberInput'

export default function GameSettingsEditor({
  gameSettings,
  editable,
  onChange,
}: {
  gameSettings: GameSettings
  editable: boolean
  onChange: (gameSettings: GameSettings) => void
}) {
  async function updateSettings(patch: Partial<typeof gameSettings>) {
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

      <NumberInput
        before={<Subheadline level="1">Стоимость первого входа</Subheadline>}
        status="focused"
        className="input"
        value={gameSettings.firstEntryCost}
        disabled={!editable}
        onChange={value =>
          updateSettings({ firstEntryCost: value })}
      />

      <NumberInput
        before={<Subheadline level="1">Стоимость повторного входа</Subheadline>}
        status="focused"
        className="input"
        value={gameSettings.reEntryCost}
        disabled={!editable}
        onChange={value =>
          updateSettings({ reEntryCost: value })}
      />

      <NumberInput
        before={<Subheadline level="1">Кол-во повторных входов</Subheadline>}
        status="focused"
        className="input"
        value={gameSettings.maxReEntries}
        disabled={!editable}
        onChange={value =>
          updateSettings({ maxReEntries: value })}
      />
    </Section>
  )
}
