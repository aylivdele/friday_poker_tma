// Оформление: цветовая тема и светлый/тёмный режим. Выбор пользователя хранится в профиле
// и дублируется в localStorage, чтобы применяться до загрузки профиля.

export const THEME_IDS = ['telegram', 'felt', 'chip', 'graphite', 'caramel'] as const
export type ThemeId = typeof THEME_IDS[number]

export const MODES = ['system', 'light', 'dark'] as const
export type Mode = typeof MODES[number]

export interface Appearance {
  theme: ThemeId
  mode: Mode
}

export interface ThemeInfo {
  id: ThemeId
  name: string
  // цвета для превью в настройках: фон, карточка, акцент
  preview: { background: string, card: string, primary: string }
}

export const THEMES: ThemeInfo[] = [
  { id: 'telegram', name: 'Как в Telegram', preview: { background: '#EFEFF4', card: '#FFFFFF', primary: '#2481CC' } },
  { id: 'felt', name: 'Сукно', preview: { background: '#F1F2F4', card: '#FFFFFF', primary: '#1D7A52' } },
  { id: 'chip', name: 'Фишка', preview: { background: '#F1F2F4', card: '#FFFFFF', primary: '#3152D4' } },
  { id: 'graphite', name: 'Графит', preview: { background: '#F1F2F4', card: '#FFFFFF', primary: '#1B1E23' } },
  { id: 'caramel', name: 'Карамель', preview: { background: '#F4F2EE', card: '#FFFFFF', primary: '#E2A23B' } },
]

export const MODE_NAMES: Record<Mode, string> = {
  system: 'Как в системе',
  light: 'Светлая',
  dark: 'Тёмная',
}

export const STORAGE_KEY = 'fp-appearance'

export function defaultAppearance(inTelegram: boolean): Appearance {
  return { theme: inTelegram ? 'telegram' : 'felt', mode: 'system' }
}

export function isAppearance(value: unknown): value is Appearance {
  const v = value as Appearance | null
  return !!v && (THEME_IDS as readonly string[]).includes(v.theme) && (MODES as readonly string[]).includes(v.mode)
}

export interface ResolvedAppearance {
  theme: ThemeId
  dark: boolean
}

// Какая тема и режим реально применяются. «Как в Telegram» вне Telegram недоступна,
// а внутри Telegram с этой темой светлый/тёмный режим всегда берётся из клиента — иначе цвета разойдутся.
export function resolveAppearance(pref: Appearance, ctx: { inTelegram: boolean, telegramDark: boolean, systemDark: boolean }): ResolvedAppearance {
  if (pref.theme === 'telegram' && ctx.inTelegram) {
    return { theme: 'telegram', dark: ctx.telegramDark }
  }
  const theme = pref.theme === 'telegram' ? 'felt' : pref.theme
  const systemDark = ctx.inTelegram ? ctx.telegramDark : ctx.systemDark
  return { theme, dark: pref.mode === 'system' ? systemDark : pref.mode === 'dark' }
}

export function readStoredAppearance(): Appearance | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    return isAppearance(value) ? value : null
  }
  catch {
    return null
  }
}

export function storeAppearance(appearance: Appearance) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
  }
  catch {}
}

// Ставит тему до первой отрисовки, чтобы не было вспышки светлой темы. Должен совпадать с resolveAppearance.
export const APPEARANCE_BOOT_SCRIPT = `(function(){try{
var a=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'null')||{};
var tg=/tgWebApp/.test(location.hash);
var t=a.theme||(tg?'telegram':'felt');
if(t==='telegram'&&!tg)t='felt';
var sys=matchMedia('(prefers-color-scheme: dark)').matches;
var d=t==='telegram'||!a.mode||a.mode==='system'?sys:a.mode==='dark';
var e=document.documentElement;e.setAttribute('data-theme',t);e.classList.toggle('dark',d);
}catch(e){}})()`
