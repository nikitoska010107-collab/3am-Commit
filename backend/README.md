# Backend

API умного кредитного кабинета: NestJS 11 на Fastify 5, Prisma 6, SQLite, JWT.

## Требования

- Node.js 20+ (проверено на 24.20.0)
- npm 10+ (в проекте использовался npm 12)

Docker не нужен: локальная БД — файл SQLite.

## Установка

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

Если npm блокирует install-скрипты (npm 12+), разрешите их один раз:

```bash
npm install-scripts approve prisma @prisma/client @prisma/engines esbuild @swc/core
```

## Команды

| Команда                  | Что делает                                              |
| ------------------------ | ------------------------------------------------------- |
| `npm run dev`            | запуск с watch на `http://localhost:3000/api`           |
| `npm run build`          | компиляция в `dist`                                     |
| `npm start`              | запуск собранного приложения                            |
| `npm run seed`           | продукты, компании, демо-пользователи, черновики заявок |
| `npm run prisma:migrate` | применить миграции                                      |
| `npm run prisma:studio`  | Prisma Studio                                           |
| `npm test`               | unit-тесты Vitest (машина статусов, скоринг, валидация) |
| `npm run lint`           | oxlint                                                  |
| `npm run format`         | prettier                                                |
| `npm run openapi:export` | выгрузить `../openapi.yaml` и `../openapi.json`         |

## Переменные окружения

| Переменная              | По умолчанию            | Назначение                              |
| ----------------------- | ----------------------- | --------------------------------------- |
| `NODE_ENV`              | `development`           | режим                                   |
| `HOST`                  | `0.0.0.0`               | адрес прослушивания                     |
| `PORT`                  | `3000`                  | порт                                    |
| `DATABASE_URL`          | `file:./dev.db`         | SQLite-файл относительно `prisma/`      |
| `JWT_SECRET`            | —                       | обязательный секрет, минимум 8 символов |
| `JWT_EXPIRES_IN`        | `1d`                    | срок жизни токена (`30m`, `12h`, `7d`)  |
| `CORS_ORIGINS`          | `http://localhost:5173` | список origin через запятую             |
| `DOCUMENT_STORAGE_PATH` | `./storage/documents`   | каталог файлов документов               |

## Основные маршруты

| Группа            | Префикс                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| Здоровье          | `GET /api/health`                                                           |
| Авторизация       | `/api/auth`                                                                 |
| Продукты          | `/api/products`                                                             |
| Заявки клиента    | `/api/applications`                                                         |
| Документы         | `/api/applications/:id/documents`, `/api/documents/:id`                     |
| Кредитная история | `/api/applications/:id/credit-history`, `/api/companies/:id/credit-history` |
| Кабинет банка     | `/api/bank/applications`                                                    |
| Уведомления       | `/api/notifications`                                                        |
| Моки источников   | `/api/mock/bki/:companyId`, `/api/mock/egrul/:inn`, `/api/mock/fns/:inn`    |

Полный контракт — Swagger UI `/api/docs` или `../openapi.yaml`.

## Устройство

```
src/
  common/       enum-ы, машина статусов, ошибки, guard-ы, декораторы, фильтр, интерсептор
  config/       валидация env (zod), AppConfig
  prisma/       PrismaService и модуль
  modules/
    auth/            регистрация, вход, профиль, JWT
    products/        кредитные продукты
    applications/    заявки, анкета, переходы статусов
    documents/       загрузка и выдача файлов
    credit-history/  снимки БКИ и проверки
    mocks/           БКИ, ЕГРЮЛ, ФНС
    scoring/         контракт скоринга и правило-базовый провайдер
    bank/            решения, подписание, выдача
    notifications/   уведомления клиента
    audit/           аудит действий
prisma/       schema.prisma, миграции, seed.ts
test/         unit-тесты
scripts/      выгрузка OpenAPI
```

## Проверка вручную

```bash
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"client.approve@demo.local\",\"password\":\"demo\"}"
```

## Заметки

- `openapi.yaml` генерируется из декораторов; вручную не редактировать.
- Все денежные суммы — целые числа в рублях.
- JSON-поля в SQLite хранятся строками: наружу API отдаёт объекты.
- Файлы документов лежат в `storage/documents` и не попадают в git.
