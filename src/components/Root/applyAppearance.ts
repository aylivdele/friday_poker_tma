import type { RGB } from '@tma.js/sdk-react'
import type { ResolvedAppearance } from '@/lib/appearance'
import { miniApp } from '@tma.js/sdk-react'
import { isTelegram } from '@/lib/platform'

function attempt(fn: () => void) {
  try {
    fn()
  }
  catch {}
}

// Ставит тему на <html> и красит под неё браузерную панель и шапку Telegram
export function applyAppearance(resolved: ResolvedAppearance) {
  const root = document.documentElement
  root.setAttribute('data-theme', resolved.theme)
  root.classList.toggle('dark', resolved.dark)
  root.style.colorScheme = resolved.dark ? 'dark' : 'light'

  const styles = getComputedStyle(root)
  const background = styles.getPropertyValue('--background').trim()
  const isHex = /^#[0-9a-f]{6}$/i.test(background)

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  if (isHex) {
    meta.content = background
  }

  if (!isTelegram()) {
    return
  }
  if (resolved.theme === 'telegram') {
    attempt(() => miniApp.setHeaderColor('secondary_bg_color'))
    attempt(() => miniApp.setBgColor('secondary_bg_color'))
  }
  else if (isHex) {
    attempt(() => miniApp.setHeaderColor(background as RGB))
    attempt(() => miniApp.setBgColor(background as RGB))
  }
}
