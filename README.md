# Friday Poker

Учёт домашних покерных игр: группы, сезоны, игры с докупами, таблица сезона и достижения.
Работает как Telegram Mini App и как обычный сайт.

- **В Telegram** вход автоматический: по подписанным данным Telegram (initData).
- **В браузере** вход по номеру телефона и паролю. Их задают в Telegram: Профиль → «Вход из браузера». Номер подтверждается через Telegram, а пароль меняется оттуда же без старого, если его забыли.

Стек: Next.js 16 (app router), React 19, MongoDB 7 (replica set: нужны транзакции), SWR, zod.

## Переменные окружения

См. `.env.example`.

| Переменная | Зачем |
|---|---|
| `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_DBNAME` | подключение к MongoDB (`authSource=admin`) |
| `TELEGRAM_BOT_TOKEN` | проверка подписи initData и номера телефона |
| `APP_ORIGIN` | адрес сайта для защиты от CSRF; без него берётся заголовок `Host` |

## Локальная разработка без Telegram

1. Поднимите MongoDB как replica set из одного узла, например в Docker:

   ```bash
   docker run -d --name fp-mongo -p 27017:27017 mongo:7 --replSet rs0
   docker exec fp-mongo mongosh --eval "rs.initiate()"
   ```

   Если включаете авторизацию, создайте пользователя в базе `admin`.
2. Заполните `.env` по образцу `.env.example`.
3. Создайте демо-данные:

   ```bash
   pnpm tsx --env-file=.env scripts/seed.ts
   ```

   Скрипт работает только с локальной базой.
4. Запустите `pnpm dev` и войдите на `/login`: телефон `+7 999 000-00-01`, пароль `demo-password`.

Проверять приложение внутри Telegram удобнее всего через туннель (например, cloudflared) и отдельного тестового бота.

## Скрипты

- `pnpm dev`: режим разработки.
- `pnpm build` / `pnpm start`: production-сборка и запуск.
- `pnpm lint`: проверка ESLint.
- `pnpm typecheck`: проверка типов TypeScript.
- `pnpm test`: юнит-тесты (vitest) на расчёт балансов, таблицу сезона, проверку подписей Telegram, пароли и телефоны.
- `pnpm tsx --env-file=.env scripts/compare-balances.ts`: показывает, как изменились итоги сезонов после перехода на пропорциональное деление банка. Скрипт только читает базу.

## Устройство

- `src/app/api/**`: API. Каждый обработчик обёрнут в `route()` из `src/server/http.ts`. Обёртка отвечает за ошибки в JSON и защиту от CSRF.
- `src/server/`: серверная логика.
  - `auth.ts`: initData или cookie-сессия.
  - `permissions.ts`: кто что может. Флаги `can` уходят в ответах API.
  - `dto.ts`: что можно отдавать наружу.
  - `games.ts`: таблица сезона, лимиты входов, каскадные удаления.
- `src/domain/`: чистые функции расчёта, общие для сервера и клиента.
- `src/lib/achievments.ts`: достижения. При каждом изменении они пересчитываются с нуля по завершённым играм, а при старте сервера — у всех игроков.
- При старте сервера (`src/instrumentation.ts`) создаются индексы и пересчитываются достижения.

## Оформление

Интерфейс собран на Tailwind CSS v4 и shadcn/ui (`src/components/ui`, стиль radix-nova, иконки Lucide), шрифт Onest.

Темы:
- Сукно — по умолчанию в браузере;
- Фишка, Графит, Карамель;
- «Как в Telegram» — только внутри Telegram и там по умолчанию; цвета берутся из клиента.

Пользователь выбирает тему и режим (как в системе / светлая / тёмная) в профиле. Выбор хранится в аккаунте (`PUT /api/me/appearance`), так что одинаков в Telegram и браузере.

- Токены тем лежат в `src/app/globals.css` и задаются атрибутом `data-theme` и классом `dark` на `<html>`.
- Логика выбора — в `src/lib/appearance.ts`.
- Цвета клиента Telegram SDK кладёт в переменные `--tgc-*`, из них собирается тема «Как в Telegram».
- Общие блоки экранов (секции, строки, аватары, степперы, суммы, подтверждения) — в `src/components/app`.

## Деплой

Прод работает через `docker-compose.yml`: приложение на порту 3001 за nginx (`nginx/friday-poker`).

После обновления конфига nginx скопируйте его на сервер и выполните `nginx -t && systemctl reload nginx`.
