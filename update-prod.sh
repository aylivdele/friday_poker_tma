set -e
git pull
pnpm build
pm2 start pm2-prod.config.js