export const apps = [
  {
    name: 'friday-poker',
    script: 'node_modules/next/dist/bin/next',
    args: 'dev -p 3000',
    env: {
      NODE_ENV: 'production',
    },
  },
]
