/* eslint-disable node/prefer-global/process -- глобальный process нужен, чтобы Next вырезал node-ветку из edge-бандла */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build') {
    // Достижения — производные данные: пересчитываем их при старте,
    // чтобы после изменения правил сохранённый прогресс совпадал с текущей логикой
    const { recalculateAllAchievments } = await import('@/lib/achievments')
    recalculateAllAchievments().catch(e => console.error('Achievments recalculation failed', e))
  }
}
