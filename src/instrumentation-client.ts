// This file is normally used for setting up analytics and other
// services that require one-time initialization on the client.

import process from 'node:process'
import { retrieveLaunchParams } from '@tma.js/sdk-react'
import { init } from './core/init'
import { isTelegram } from './lib/platform'

// Вне Telegram SDK не инициализируется: приложение работает как обычный сайт
if (isTelegram()) {
  try {
    const launchParams = retrieveLaunchParams()
    const { tgWebAppPlatform: platform } = launchParams
    const debug
      = (launchParams.tgWebAppStartParam || '').includes('debug')
        || process.env.NODE_ENV === 'development'

    init({
      debug,
      eruda: debug && ['ios', 'android'].includes(platform),
      mockForMacOS: platform === 'macos',
    })
  }
  catch (e) {
    console.error(e)
  }
}
