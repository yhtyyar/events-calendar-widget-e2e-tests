# 🚀 Быстрый старт

## Требования
- Node.js 18+
- npm 9+

## Установка

```bash
git clone https://github.com/yhtyyar/events-calendar-widget-e2e-tests.git
cd events-calendar-widget-e2e-tests
npm install
npx playwright install
```

## Запуск тестов

```bash
# Все тесты
npm test

# Smoke-тесты (быстро)
npm run test:smoke

# Конкретный браузер
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Мобильные
npm run test:mobile

# С UI (интерактивный режим)
npm run test:ui

# С отображением браузера
npm run test:headed
```

## Отчёты

```bash
# Открыть HTML-отчёт
npm run report
```

Отчёты сохраняются в `reports/html/`.

## Отладка

```bash
# Debug режим
npm run test:debug

# Verbose логирование
DEBUG=pw:api npm test
```

### Windows (PowerShell)
```powershell
$env:DEBUG = "pw:api"
npm test
```

## Структура проекта

```
├── config/          # Тестовые данные
├── src/
│   ├── pages/       # Page Objects
│   ├── utils/       # Хелперы
│   └── fixtures/    # Фикстуры
├── tests/
│   ├── smoke/       # P0 тесты
│   ├── functional/  # Функциональные
│   ├── visual/      # Адаптивные
│   └── accessibility/
└── reports/         # Артефакты (gitignored)
```

## Проблемы и решения

| Проблема | Решение |
|----------|---------|
| Браузеры не установлены | `npx playwright install --with-deps` |
| Тесты падают с таймаутом | Проверьте сеть, увеличьте `timeout` |
| Ошибки clipboard в Firefox | Используется fallback-стратегия |

---

*Подробнее: [TEST_PLAN.md](TEST_PLAN.md)*
