# HANDOFF

Ветка: `BACKand` (от `main`, коммит `e2a522b`). Backend готов к демо, фронтенд ещё не подключён.

## Состояние

- API работает: NestJS 11 + Fastify + Prisma + SQLite.
- Пройдены `npm run build`, `npm test` (21 тест), seed и сквозной smoke.
- Контракт: `openapi.yaml` / `openapi.json`, Swagger UI на `/api/docs`.
- Документация по четырём задачам дня — в `docs/`, отчёт — `REPORT.md`.

## Запуск

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:migrate
npm run seed
npm run dev
```

API — `http://localhost:3000/api`, Swagger — `/api/docs`.
Демо-пароль у всех аккаунтов `demo`, список — в `README.md`.

## Что дальше

1. Фронтенду: подключить axios к `openapi.yaml`, порт 5173 уже в CORS, обработка ошибок `{code, message, details}`.
2. Владу: реализовать `ScoringProvider` по `docs/05-scoring-contract.md` и заменить провайдер в `scoring.module.ts`.
3. Перед публикацией: rate limiting на логин, проверка ИНН через ЕГРЮЛ, Postgres, S3 для документов.
4. Запушить `BACKand` в `origin` (нужен PAT или ручной push через GCM).

## Важно

- В коде нет комментариев — не добавлять.
- Секреты, БД и `storage/` не коммитятся.
- В `main` не мержить без договорённости.
- `openapi.yaml` генерируется, руками не править: `npm run openapi:export`.
