import antfu from '@antfu/eslint-config'

export default antfu({
  extends: 'next/core-web-vitals',
  // Компоненты shadcn генерируются CLI в своём стиле
  ignores: ['src/components/ui/**'],
})
