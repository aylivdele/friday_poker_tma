/* eslint-disable node/prefer-global/process -- глобальный process нужен, чтобы Next вырезал node-ветку из edge-бандла */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build') {
    const { runMigrations } = await import('@/server/migrations')
    // Достижения — производные данные: пересчитываем их при старте,
    // чтобы после изменения правил сохранённый прогресс совпадал с текущей логикой
    const { recalculateAllAchievments } = await import('@/lib/achievments')
    runMigrations()
      .then(() => recalculateAllAchievments())
      .catch(e => console.error('Startup tasks failed', e))
  }
}
