# Заявки: что вводит клиент и где это валидируется

## Что вводит клиент

### Шаг 1. Параметры кредита (обязательно при создании)

| Поле | Тип | Правила |
| --- | --- | --- |
| `productId` | string | продукт существует и активен |
| `amount` | целое, ₽ | `>= 1`, плюс лимиты продукта `minAmount..maxAmount` |
| `term` | целое, мес. | `1..120`, плюс лимиты продукта `minTerm..maxTerm` |
| `purpose` | string | не короче 10 символов |
| `purposeCode` | enum, опц. | `WORKING_CAPITAL`, `EQUIPMENT`, `INVENTORY`, `EXPANSION`, `REFINANCING`, `PAYROLL` |

### Шаг 2. Анкета предпринимателя (можно сохранять в черновике)

| Поле | Тип | Правила | Обязательно к отправке |
| --- | --- | --- | --- |
| `contactPhone` | string | не короче 6 символов | да |
| `contactEmail` | e-mail | валидный адрес | да |
| `monthlyTurnover` | целое, ₽ | `>= 0` | нет |
| `averageSalary` | целое, ₽ | `>= 0` | нет |
| `employeeCount` | целое | `>= 0` | нет |
| `existingLoans` | целое | `>= 0` | нет |
| `hasOverdueDebt` | boolean | `true/false` | нет |
| `company` | объект, опц. | снимок данных компании: `name` (≥2), `inn` (≥10), `legalForm` (enum), `industry` (≥2), `revenue` (≥0), `foundedAt` (ISO-8601) | ИНН, отрасль, выручка и дата регистрации должны быть заполнены в профиле |

Данные компании берутся из профиля пользователя; блок `company` позволяет уточнить их из формы.

## Где валидируется (слои)

| Слой | Где | Что проверяет | Ответ |
| --- | --- | --- | --- |
| 1. Формат | `CreateApplicationDto` / `UpdateApplicationDto` / `SubmitApplicationDto` (class-validator) + глобальный `ValidationPipe` | типы, диапазоны, enum, e-mail, длины, запрет лишних полей | `400 VALIDATION_ERROR`, `details.fields` |
| 2. Условия продукта | `ApplicationsService.assertWithinProductLimits` | сумма и срок в рамках продукта | `400`, `details.amount` / `details.term` |
| 3. Полнота анкеты | `ApplicationsService.collectMissingFields` при `submit` | контакты, цель, ИНН/отрасль/выручка/дата компании | `400`, `details.missingFields` |
| 4. Статус | сервисы `updateDraft`, `submit`, `respondToInfoRequest`, `acceptOffer` | правка только `DRAFT`, отправка только `DRAFT`, ответ только `INFO_REQUESTED` | `409 CONFLICT` |
| 5. Переход статуса | `ApplicationStateService` + `state-machine.ts` | разрешён ли переход | `409 INVALID_TRANSITION` |
| 6. Доступ | `getAccessible` + guards ролей | клиент — только свои объекты, банк — все | `403` / `404` |

Фронтенд дублирует правила в zod/react-hook-form только для UX. Источник истины — backend: даже при обходе формы API вернёт ошибку.

## Статусы и переходы

```
DRAFT ──submit──> SUBMITTED ──(авто)──> CHECKING ──(авто)──> UNDER_REVIEW
UNDER_REVIEW ──> APPROVED | COUNTER_OFFER | REJECTED | INFO_REQUESTED
INFO_REQUESTED ──info-response──> UNDER_REVIEW
APPROVED | COUNTER_OFFER ──offer/accept──> OFFER_ACCEPTED ──sign──> DOCS_SIGNED ──disburse──> DISBURSED
DRAFT | COUNTER_OFFER ──cancel──> CANCELLED
```

- `TERMINAL`: `REJECTED`, `DISBURSED`, `CANCELLED`.
- Переходы делает только backend; клиент не может выставить статус напрямую.
- `SUBMITTED → CHECKING → UNDER_REVIEW` выполняет скоринг при первом запуске.

## Эндпоинты

| Метод | Путь | Роль | Назначение |
| --- | --- | --- | --- |
| `POST` | `/api/applications` | `CLIENT` | создать черновик |
| `GET` | `/api/applications?status=&productId=&clientId=` | все | клиент видит свои, банк — все |
| `GET` | `/api/applications/:id` | владелец / банк | карточка |
| `PATCH` | `/api/applications/:id` | `CLIENT` | правка черновика |
| `POST` | `/api/applications/:id/submit` | `CLIENT` | отправка на рассмотрение |
| `POST` | `/api/applications/:id/cancel` | `CLIENT` | отзыв |
| `POST` | `/api/applications/:id/info-response` | `CLIENT` | ответ на запрос банка |
| `POST` | `/api/applications/:id/offer/accept` | `CLIENT` | принять предложение |
| `GET` | `/api/applications/:id/history` | владелец / банк | история статусов |
| `GET` | `/api/applications/:id/data` | владелец / банк | доп. данные анкеты |
| `GET` | `/api/applications/:id/offers` | владелец / банк | предложения |
| `GET` | `/api/applications/:id/audit` | владелец / банк | аудит |
| `POST` | `/api/bank/applications/:id/score` | банк | скоринг |
| `GET` | `/api/bank/applications/:id/scoring` | банк | последний скоринг |
| `POST` | `/api/bank/applications/:id/decision` | банк | решение |
| `POST` | `/api/bank/applications/:id/sign` | банк | подписание (симуляция) |
| `POST` | `/api/bank/applications/:id/disburse` | банк | выдача (симуляция) |

## Предложения банка

- `APPROVE` создаёт `Offer` типа `STANDARD` на запрошенных условиях и переводит заявку в `APPROVED`.
- `COUNTER_OFFER` создаёт `Offer` типа `COUNTER` с новыми суммой/сроком/ставкой и переводит в `COUNTER_OFFER`.
- Новое решение гасит предыдущие активные предложения (`EXPIRED`).
- Клиент принимает активное предложение — оно становится `ACCEPTED`, заявка уходит в `OFFER_ACCEPTED`.
- Все действия пишутся в `StatusHistory`, `Decision` и `AuditLog`.

## Пример создания

```http
POST /api/applications
Authorization: Bearer <token>

{
  "productId": "<id из GET /api/products>",
  "amount": 1500000,
  "term": 24,
  "purpose": "Закупка оборудования для расширения производства",
  "purposeCode": "EQUIPMENT",
  "contactPhone": "+7 900 111-22-33",
  "contactEmail": "client.approve@demo.local",
  "monthlyTurnover": 2000000,
  "employeeCount": 18,
  "existingLoans": 0,
  "hasOverdueDebt": false
}
```

Ответ — `201` с объектом заявки, в котором `status: "DRAFT"`, `formPayload` и `missingFields`.
