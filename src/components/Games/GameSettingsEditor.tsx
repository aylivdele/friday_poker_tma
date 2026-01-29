'use client'

import type { GameSettings } from './../../types/db'
import {
  Cell,
  Input,
  Section,
  Switch,
} from '@telegram-apps/telegram-ui'

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
                firstEntryCost: e.target.checked ? 300 : 100,
                maxReEntries: e.target.checked ? 3 : 6,
              })}
          />
        )}
      >
        Финальная игра сезона
      </Cell>

      <Input
        header="Стоимость первого входа"
        type="number"
        value={gameSettings.firstEntryCost}
        disabled={!editable}
        onChange={e =>
          updateSettings({ firstEntryCost: +e.target.value })}
      />

      <Input
        header="Стоимость повторного входа"
        type="number"
        value={gameSettings.reEntryCost}
        disabled={!editable}
        onChange={e =>
          updateSettings({ reEntryCost: +e.target.value })}
      />

      <Input
        header="Кол-во повторных входов"
        type="number"
        value={gameSettings.maxReEntries}
        disabled={!editable}
        onChange={e =>
          updateSettings({ maxReEntries: +e.target.value })}
      />
    </Section>
  )
}
