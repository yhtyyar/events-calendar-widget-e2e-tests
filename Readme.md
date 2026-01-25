# Events Calendar Widget E2E Tests

[![E2E Tests](https://github.com/yhtyyar/events-calendar-widget-e2e-tests/actions/workflows/e2e.yml/badge.svg)](https://github.com/yhtyyar/events-calendar-widget-e2e-tests/actions/workflows/e2e.yml)

E2E автотесты для [виджета календаря мероприятий 3Snet](https://dev.3snet.info/eventswidget/).

## Быстрый старт

```bash
git clone https://github.com/yhtyyar/events-calendar-widget-e2e-tests.git
cd events-calendar-widget-e2e-tests
npm install
npx playwright install
npm test
```

## Команды

| Команда | Описание |
|---------|----------|
| `npm test` | Все тесты |
| `npm run test:smoke` | Smoke-тесты (P0) |
| `npm run test:chromium` | Только Chromium |
| `npm run test:mobile` | Mobile (Pixel 5 + iPhone 12) |
| `npm run test:ui` | Интерактивный режим |
| `npm run report` | Открыть HTML-отчёт |

## Структура

```
├── config/          # Тестовые данные
├── src/
│   ├── pages/       # Page Objects
│   ├── utils/       # Хелперы
│   └── fixtures/    # Фикстуры Playwright
├── tests/
│   ├── smoke/       # Smoke (P0)
│   ├── functional/  # Функциональные (P0)
│   ├── visual/      # Адаптивные (P1)
│   └── accessibility/  # A11Y (P2)
└── docs/            # Документация
```

## Покрытие

| Браузер | Desktop | Mobile |
|---------|:-------:|:------:|
| Chrome | ✅ | ✅ Pixel 5 |
| Firefox | ✅ | — |
| Safari | ✅ | ✅ iPhone 12 |

## Документация

- **[Тест-план](docs/TEST_PLAN.md)** — стратегия, матрица покрытия, сценарии
- **[Быстрый старт](docs/SETUP_GUIDE.md)** — установка и отладка

## CI/CD

Тесты запускаются автоматически при push в `main` и Pull Request.  
Артефакты (отчёты, скриншоты) сохраняются 7 дней.

## Ограничения

- **Firefox**: Clipboard API через fallback (execCommand)
- **Mobile Safari**: только скриншоты, без видео