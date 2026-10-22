# 3am-Commit — умный кредитный кабинет предпринимателя

Хакатон Alfa Hack 2026. Сервис, который ведёт предпринимателя от расчёта кредита до решения банка: заявка, проверка компании и кредитной истории, прозрачный скоринг с объяснением каждого фактора, предложение банка и уведомления.

## Стек

| Слой | Технологии |
| --- | --- |
| Backend | NestJS 11, Fastify 5, TypeScript, Prisma 6, SQLite, JWT, class-validator, Swagger, Vitest |
| Frontend | React 19, Vite 8, TypeScript, TanStack Query, react-hook-form + zod, Tailwind 4, react-router 7, axios |
| Контракт | OpenAPI (`openapi.yaml`), Swagger UI на `/api/docs` |

Внешние источники (БКИ, ЕГРЮЛ, ФНС) заменены детерминированными моками: только синтетические данные.

## Структура

```
backend/            API, Prisma-схема, миграции, seed, тесты, скрипт выгрузки OpenAPI
frontend/           клиентское приложение (ветка 4rlein, React + Vite)
docs/               описание хранения, авторизации, заявок, кредитной истории, контракт скоринга
openapi.yaml        актуальный контракт для фронтенда
openapi.json        тот же контракт в JSON
```

## Быстрый старт backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:migrate
npm run seed
npm run dev
```

- API: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`
- Проверка: `GET http://localhost:3000/api/health`

## Демо-доступы

Пароль у всех — `demo`.

| E-mail | Роль | Сценарий |
| --- | --- | --- |
| `client.approve@demo.local` | `CLIENT` | хорошая история → одобрение |
| `client.counter@demo.local` | `CLIENT` | просрочка → контрпредложение |
| `client.reject@demo.local` | `CLIENT` | банкротство → отказ |
| `underwriter@demo.local` | `UNDERWRITER` | кабинет банка |
| `admin@demo.local` | `ADMIN` | администрирование |

## Сквозной сценарий

1. Клиент входит, выбирает продукт, заполняет заявку, отправляет её.
2. Банк обновляет кредитную историю, запускает скоринг, видит балл и факторы.
3. Банк принимает решение: одобрение, контрпредложение, отказ или запрос данных.
4. Клиент принимает предложение, банк подписывает документы и выдаёт кредит (симуляция).
5. Все шаги видны в истории статусов, аудите и уведомлениях.

## Документация

- [`docs/01-storage.md`](docs/01-storage.md) — где хранятся данные и документы
- [`docs/02-auth.md`](docs/02-auth.md) — регистрация, вход, роли, JWT
- [`docs/03-applications.md`](docs/03-applications.md) — поля заявки и слои валидации
- [`docs/04-credit-history.md`](docs/04-credit-history.md) — кредитная история и моки БКИ
- [`docs/05-scoring-contract.md`](docs/05-scoring-contract.md) — контракт скоринга для ML-модели
- [`backend/README.md`](backend/README.md) — команды, переменные окружения, тесты
- [`HANDOFF.md`](HANDOFF.md) — состояние работы и следующие шаги

## Правила ветки

- Ветка backend-разработки — `BACKand`, в `main` мержим только по договорённости.
- В коде не оставляем комментариев.
- Секреты и файлы БД не коммитим (см. `.gitignore`).

