# Контракт скоринга (для Влада)

Задача: заменить правило-базовый скоринг на модель, не меняя API, БД и фронтенд. Ниже — точки подключения, входные и выходные данные, правила решений.

## Что уже есть

| Файл | Роль |
| --- | --- |
| `backend/src/modules/scoring/scoring.types.ts` | типы `ScoringContext`, `ScoringResultPayload`, интерфейс `ScoringProvider`, токен `SCORING_PROVIDER`, коды и веса факторов |
| `backend/src/modules/scoring/rule-based-scoring.provider.ts` | текущая заглушка на правилах, `modelVersion = 'rule-based-v1'` |
| `backend/src/modules/scoring/scoring.service.ts` | загружает данные, вызывает провайдер, сохраняет результат, пишет аудит |
| `backend/src/modules/bank/decision.service.ts` | решение банка на основе результата и параметров заявки |

## API (менять нельзя)

| Метод | Путь | Роль | Тело / ответ |
| --- | --- | --- | --- |
| `POST` | `/api/bank/applications/:id/score` | `UNDERWRITER`, `ADMIN` | без тела, ответ — `ScoringResultDto` |
| `GET` | `/api/bank/applications/:id/scoring` | `UNDERWRITER`, `ADMIN` | последний `ScoringResultDto` или `null` |
| `POST` | `/api/bank/applications/:id/decision` | `UNDERWRITER`, `ADMIN` | `{ type, reason?, counterAmount?, counterTerm?, counterRate?, message?, missingFields? }` |

`ScoringResultDto`:

```json
{
  "id": "uuid",
  "applicationId": "uuid",
  "score": 78,
  "riskLevel": "LOW",
  "modelVersion": "rule-based-v1",
  "summary": "Балл 78 из 100, риск LOW. Слабейший фактор: ...",
  "factors": [
    {
      "code": "CREDIT_HISTORY",
      "title": "Качество кредитной истории",
      "value": 23,
      "weight": 25,
      "contribution": 23,
      "explanation": "Просрочек нет, кредитная история закрытых обязательств положительная."
    }
  ],
  "createdAt": "2026-10-22T15:00:00.000Z"
}
```

## Вход провайдера

```ts
interface ScoringContext {
  application: Application   // amount, term, purpose, formPayload (JSON-строка)
  company: Company           // inn, industry, revenue, foundedAt, legalForm
  product: Product           // rate, minAmount, maxAmount, minTerm, maxTerm
  creditReport: CreditReportDto | null  // история БКИ или null
  formPayload: Record<string, unknown>  // уже распарсенный formPayload
}
```

Полезные поля `formPayload`: `monthlyTurnover`, `averageSalary`, `employeeCount`, `existingLoans`, `hasOverdueDebt`, `purposeCode`, `contactPhone`, `contactEmail`.

Полезные поля `creditReport`: `creditScore` (0..1000), `overdueDays`, `overdueAmount`, `totalDebt`, `monthlyDebtPayment`, `openLoans`, `closedLoans`, `hasBankruptcy`, `isLiquidated`.

## Выход провайдера

```ts
interface ScoringProvider {
  readonly modelVersion: string
  evaluate(context: ScoringContext): Promise<ScoringResultPayload>
}

interface ScoringResultPayload {
  score: number          // целое 0..100
  riskLevel: RiskLevel   // LOW | MEDIUM | HIGH
  summary: string        // 1–2 предложения, обязательное объяснение
  factors: ScoringFactorResult[]  // непустой массив
}
```

Требования к выходу:

- `score` — целое в диапазоне `0..100`, детерминированное для одного и того же входа.
- Каждый фактор: `code` из `SCORING_FACTOR_CODES`, `title` на русском, `value`, `weight`, `contribution`, `explanation` (обязательное человекочитаемое объяснение).
- `0 <= contribution <= weight`, сумма весов = 100.
- `riskLevel` соответствует баллу: `LOW >= 70`, `MEDIUM 45..69`, `HIGH < 45` (порог можно поменять в `DecisionService`, но согласовать с фронтом).
- Время работы — до 5 секунд на заявку, без сетевых вызовов внутри (все данные уже в контексте).

Текущие коды факторов и веса (`SCORING_FACTOR_WEIGHTS`):

| Код | Фактор | Вес |
| --- | --- | --- |
| `CREDIT_HISTORY` | Качество кредитной истории | 25 |
| `DEBT_BURDEN` | Долговая нагрузка | 20 |
| `REVENUE_STABILITY` | Стабильность выручки | 20 |
| `BUSINESS_AGE` | Возраст бизнеса | 15 |
| `AMOUNT_TO_REVENUE` | Отношение суммы к выручке | 10 |
| `INDUSTRY_RISK` | Отраслевой риск | 10 |

Если модель использует другие факторы — добавьте коды в `SCORING_FACTOR_CODES` и веса в `SCORING_FACTOR_WEIGHTS`: их сохраняет `ScoringService`, они автоматически попадут в OpenAPI и на фронт.

## Как подключить модель

1. Создайте `backend/src/modules/scoring/ml-scoring.provider.ts`, реализующий `ScoringProvider`.
2. В `scoring.module.ts` замените `{ provide: SCORING_PROVIDER, useExisting: RuleBasedScoringProvider }` на свой класс.
3. `ScoringService` не меняется: он уже получает провайдер по токену `SCORING_PROVIDER`.
4. Прогоните `npm test` и `npm run openapi:export` — контракт обновится автоматически.

Правило-базовый провайдер оставьте как fallback для демо: он детерминирован и не требует зависимостей.

## Решения и их связь со скорингом

`DecisionService` не вызывает модель, а принимает решение андеррайтера. Но фронт и сценарий используют подсказки:

| `riskLevel` | Рекомендация в UI | Решение |
| --- | --- | --- |
| `LOW` | «Можно одобрять» | `APPROVE` |
| `MEDIUM` | «Контрпредложение» | `COUNTER_OFFER` |
| `HIGH` | «Отказ или запрос данных» | `REJECT` / `INFO_REQUEST` |

Ограничения продукта (сумма/срок) проверяются до скоринга в `ApplicationsService`, дублировать их в модели не нужно.

## Чек-лист сдачи

- [ ] Модель реализует `ScoringProvider`, `modelVersion` информативен (например, `gbm-v1`).
- [ ] `score` в `0..100`, `riskLevel` согласован с порогами.
- [ ] У каждого фактора есть `explanation` на русском.
- [ ] Нет сетевых вызовов и обращений к БД внутри `evaluate`.
- [ ] Детерминизм: одинаковый вход → одинаковый выход.
- [ ] `npm run build`, `npm test`, `npm run openapi:export` проходят.
- [ ] Сценарии из `docs/04-credit-history.md` дают ожидаемые исходы (одобрение / контрпредложение / отказ).
