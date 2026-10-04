'use client'

import type { Appearance, Mode, ThemeId } from '@/lib/appearance'
import { CheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { MODE_NAMES, MODES, THEMES } from '@/lib/appearance'
import { getErrorMessage } from '@/lib/errors'
import { haptic } from '@/lib/haptics'
import { isTelegram } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useAppearanceStore } from '@/stores/appearanceStore'

export function AppearanceSettings() {
  const appearance = useAppearanceStore(s => s.appearance)
  const setAppearance = useAppearanceStore(s => s.setAppearance)
  const inTelegram = isTelegram()
  const themes = THEMES.filter(t => t.id !== 'telegram' || inTelegram)
  // Вне Telegram «Как в Telegram» показывается как Сукно — так и подсвечиваем
  const selectedTheme: ThemeId = appearance.theme === 'telegram' && !inTelegram ? 'felt' : appearance.theme

  const update = (next: Appearance) => {
    haptic('select')
    setAppearance(next)
    api.put('/api/me/appearance', next).catch(e => toast.error(`Не удалось сохранить оформление: ${getErrorMessage(e)}`))
  }

  return (
    <section className="px-4 pt-6">
      <h2 className="px-1 pb-2 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Оформление</h2>
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {themes.map(theme => (
            <button
              key={theme.id}
              type="button"
              aria-pressed={selectedTheme === theme.id}
              onClick={() => update({ ...appearance, theme: theme.id })}
              className={cn(
                'flex flex-col gap-2 rounded-xl p-2 text-left ring-1 ring-border transition-shadow',
                selectedTheme === theme.id && 'ring-2 ring-primary',
              )}
            >
              <span className="relative block h-14 overflow-hidden rounded-lg" style={{ background: theme.preview.background }}>
                <span className="absolute inset-x-2 top-2 h-4 rounded" style={{ background: theme.preview.card }} />
                <span className="absolute bottom-2 left-2 h-4 w-12 rounded-full" style={{ background: theme.preview.primary }} />
                {selectedTheme === theme.id && (
                  <span className="absolute right-1.5 bottom-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="px-0.5 text-sm font-medium">{theme.name}</span>
            </button>
          ))}
        </div>

        {selectedTheme === 'telegram'
          ? <p className="text-sm text-muted-foreground">Цвета, светлая и тёмная тема — как в вашем Telegram.</p>
          : (
              <div role="radiogroup" aria-label="Режим" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                {MODES.map((mode: Mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={appearance.mode === mode}
                    onClick={() => update({ ...appearance, theme: selectedTheme, mode })}
                    className={cn(
                      'h-9 rounded-lg text-sm font-medium text-muted-foreground transition-colors',
                      appearance.mode === mode && 'bg-card text-foreground shadow-sm',
                    )}
                  >
                    {MODE_NAMES[mode]}
                  </button>
                ))}
              </div>
            )}
      </div>
    </section>
  )
}
