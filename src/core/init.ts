import type { ThemeParams } from '@tma.js/sdk-react'
import {
  backButton,
  closingBehavior,
  emitEvent,
  initData,
  init as initSDK,
  miniApp,
  mockTelegramEnv,
  retrieveLaunchParams,
  setDebug,
  swipeBehavior,
  themeParams,
  viewport,
} from '@tma.js/sdk-react'

/**
 * Initializes the application and configures its dependencies.
 */
export async function init(options: {
  debug: boolean
  eruda: boolean
  mockForMacOS: boolean
}): Promise<void> {
  // Set @tma.js/sdk-react debug mode and initialize it.
  setDebug(options.debug)
  initSDK()

  // Add Eruda if needed.
  options.eruda
  && void import('eruda').then(({ default: eruda }) => {
    eruda.init()
    eruda.position({ x: window.innerWidth - 50, y: 0 })
  })

  // Telegram for macOS has a ton of bugs, including cases, when the client doesn't
  // even response to the "web_app_request_theme" method. It also generates an incorrect
  // event for the "web_app_request_safe_area" method.
  if (options.mockForMacOS) {
    let firstThemeSent = false
    mockTelegramEnv({
      onEvent(event, next) {
        if (event.name === 'web_app_request_theme') {
          let tp: Partial<ThemeParams> = {}
          if (firstThemeSent) {
            const state = themeParams.state
            tp = state as Partial<ThemeParams>
          }
          else {
            firstThemeSent = true
            const lp = retrieveLaunchParams()
            tp = (lp.tgWebAppThemeParams || {}) as Partial<ThemeParams>
          }
          return emitEvent('theme_changed', { theme_params: tp as any })
        }

        if (event.name === 'web_app_request_safe_area') {
          return emitEvent('safe_area_changed', {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          })
        }

        next()
      },
    })
  }

  // Mount all components used in the project. Кнопки действий рисуются на странице,
  // поэтому нативные MainButton и SecondaryButton не используются.
  backButton.mount()
  initData.restore()
  themeParams.mount()

  try {
    miniApp.mount()
    // Цвета темы клиента кладём в переменные --tgc-*: их читает тема «Как в Telegram» (см. globals.css)
    themeParams.bindCssVars(key => `--tgc-${key.replace(/_/g, '-').replace(/([A-Z])/g, '-$1').toLowerCase()}`)
  }
  catch (e) {
    // miniApp not available
    console.error(e)
  }

  try {
    // Иначе вертикальный свайп по шторкам и спискам сворачивает приложение
    swipeBehavior.mount()
    swipeBehavior.disableVertical()
  }
  catch (e) {
    console.error(e)
  }

  try {
    closingBehavior.mount()
  }
  catch (e) {
    console.error(e)
  }

  viewport.mount()
    .then(() => {
      viewport.bindCssVars()
      viewport.expand()
    })
    .catch(e => console.error(e))

  try {
    miniApp.ready()
  }
  catch (e) {
    console.error(e)
  }
}
