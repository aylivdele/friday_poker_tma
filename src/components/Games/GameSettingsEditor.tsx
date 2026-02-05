'use client'

import type { GameSettings } from './../../types/db'
import {
  Caption,
  Cell,
  Input,
  Section,
  Subheadline,
  Switch,
  Text,
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
                reEntryCost: 100,
                maxReEntries: e.target.checked ? 3 : 5,
              })}
          />
        )}
      >
        Финальная игра сезона
      </Cell>

      <Cell before={<Subheadline level="1">Стоимость первого входа</Subheadline>}>
        <Input
          status="focused"
          className="input"
          type="number"
          value={gameSettings.firstEntryCost}
          disabled={!editable}
          onChange={e =>
            updateSettings({ firstEntryCost: +e.target.value })}
        />
      </Cell>

      <Cell before={<Subheadline level="1">Стоимость повторного входа</Subheadline>}>
        <Input
          status="focused"
          className="input"
          type="number"
          value={gameSettings.reEntryCost}
          disabled={!editable}
          onChange={e =>
            updateSettings({ reEntryCost: +e.target.value })}
        />
      </Cell>

      <Cell before={<Subheadline level="1">Кол-во повторных входов</Subheadline>}>
        <Input
          status="focused"
          className="input"
          type="number"
          value={gameSettings.maxReEntries}
          disabled={!editable}
          onChange={e =>
            updateSettings({ maxReEntries: +e.target.value })}
        />
      </Cell>
    </Section>
  )
}
