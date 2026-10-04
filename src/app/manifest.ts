import type { MetadataRoute } from 'next'

// Сайт можно добавить на экран «Домой» и открывать как приложение, без адресной строки
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Friday Poker',
    short_name: 'Friday Poker',
    description: 'Учёт домашних покерных игр, сезонов и достижений',
    lang: 'ru',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F1F2F4',
    theme_color: '#F1F2F4',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
