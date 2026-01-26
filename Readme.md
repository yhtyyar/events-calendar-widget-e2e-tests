# Events Calendar Widget E2E Tests

[![E2E Tests](https://github.com/yhtyyar/events-calendar-widget-e2e-tests/actions/workflows/e2e.yml/badge.svg)](https://github.com/yhtyyar/events-calendar-widget-e2e-tests/actions/workflows/e2e.yml)

E2E автотесты для [виджета календаря мероприятий 3Snet](https://dev.3snet.info/eventswidget/).

**Технологии:** Playwright + TypeScript | **Тестов:** 34 | **Браузеров:** 5 конфигураций

---

## Быстрый старт

```bash
git clone https://github.com/yhtyyar/events-calendar-widget-e2e-tests.git
cd events-calendar-widget-e2e-tests
npm install
npx playwright install
npm test
```

> **Требования:** Node.js ≥ 18.0.0

---

## Что проверяется

### Smoke-тесты (P0) — 8 тестов
Критические проверки базовой работоспособности:
- Загрузка страницы с HTTP 200
- Отображение заголовка «Нравится наш календарь мероприятий?»
- Наличие описательного текста на странице
- Title страницы содержит слово «календарь»
- Футер отображается корректно
- Отсутствие критических ошибок в консоли (CORS, favicon игнорируются)
- Наличие ссылки на календарь мероприятий
- URL содержит `/eventswidget/` после загрузки

### Функциональные тесты (P0) — 9 тестов
Проверка основного бизнес-функционала:
- Наличие элементов интерфейса генерации виджета
- Видимость поля с кодом для вставки
- Валидность генерируемого HTML-кода (`<iframe>`, `<script>`, `<div>`)
- Работа выбора дизайна виджета
- Наличие и работа кнопки копирования
- Clipboard API (с fallback через `document.execCommand`)
- Корректная работа копирования без ошибок в консоли

### Адаптивные тесты (P1) — 10 тестов
Проверка отображения на разных устройствах:
- Мобильные (iPhone 12, Pixel 5): отсутствие горизонтального скролла, видимость элементов
- Планшеты (iPad, iPad Pro): корректный layout
- Десктоп (1920×1080, 1366×768): полноценное отображение всех секций
- Тесты ресайза окна без поломки вёрстки

### Тесты доступности (P2) — 11 тестов
Базовые проверки a11y по WCAG:
- Атрибут `lang` на `<html>` (WCAG 3.1.1)
- Alt-тексты для всех изображений (WCAG 1.1.1)
- Наличие единственного `<h1>` (WCAG 1.3.1)
- Ссылки с различимым текстом или `aria-label`
- Формы с связанными `<label>` или `aria-*`
- Кнопки с доступными именами
- Базовая проверка контрастности текста
- Клавиатурная навигация (Tab)
- Наличие landmarks (`<main>`, `<nav>`, `<header>`)
- Видимый индикатор фокуса

---

## Команды

| Команда | Описание |
|---------|----------|
| `npm test` | Все тесты |
| `npm run test:smoke` | Smoke-тесты (P0) |
| `npm run test:functional` | Функциональные (P0) |
| `npm run test:visual` | Адаптивные (P1) |
| `npm run test:a11y` | Тесты доступности (P2) |
| `npm run test:chromium` | Только Chromium |
| `npm run test:firefox` | Только Firefox |
| `npm run test:webkit` | Только WebKit (Safari) |
| `npm run test:mobile` | Mobile (Pixel 5 + iPhone 12) |
| `npm run test:headed` | С UI браузера |
| `npm run test:debug` | Debug mode |
| `npm run test:ui` | Интерактивный режим |
| `npm run report` | Playwright HTML-отчёт |
| `npm run report:allure` | Allure-отчёт (детальный) |

---

## Структура проекта

```
├── config/              # Централизованные тестовые данные
│   └── test-data.ts     # URLs, viewports, expected texts
├── src/
│   ├── pages/           # Page Object Model
│   │   ├── BasePage.ts  # Базовый класс
│   │   └── EventsWidgetPage.ts
│   ├── utils/           # Утилиты
│   │   ├── helpers.ts   # Хелперы
│   │   ├── logger.ts    # Логирование
│   │   └── selectors.ts # Централизованные селекторы
│   └── fixtures/        # Playwright fixtures
├── tests/
│   ├── smoke/           # Smoke-тесты (8)
│   ├── functional/      # Функциональные (9)
│   ├── visual/          # Адаптивные (10)
│   └── accessibility/   # A11Y (11)
└── docs/                # Документация
    ├── TEST_PLAN.md     # Детальный тест-план
    └── SETUP_GUIDE.md   # Инструкция по установке
```

---

## Покрытие по браузерам

| Браузер | Desktop | Mobile | Особенности |
|---------|:-------:|:------:|-------------|
| Chromium | ✅ 1920×1080 | ✅ Pixel 5 | Полная поддержка |
| Firefox | ✅ 1920×1080 | ⚠️ Limited | Clipboard API через fallback |
| WebKit | ✅ 1920×1080 | ✅ iPhone 12 | Только скриншоты (без видео) |

---

## Архитектурные решения

- **Page Object Model** — инкапсуляция UI-логики в `EventsWidgetPage`
- **Централизованные селекторы** — `src/utils/selectors.ts` для лёгкой поддержки
- **Data-driven подход** — тестовые данные в `config/test-data.ts`
- **Soft assertions** — проблемы приложения фиксируются через `test.info().annotations`
- **Fallback-стратегии** — альтернативные проверки для нестабильных элементов
- **Retry на CI** — 2 попытки для снижения flaky tests

---

## Документация

- **[Тест-план](docs/TEST_PLAN.md)** — стратегия, матрица покрытия, детальные тест-кейсы
- **[Быстрый старт](docs/SETUP_GUIDE.md)** — установка, настройка, отладка

---

## CI/CD

Тесты запускаются автоматически:
- При **push** в `main`
- При создании **Pull Request**

**Артефакты:**
| Тип | Описание | Хранение |
|-----|----------|----------|
| `playwright-report` | HTML-отчёт | 7 дней |
| `allure-results` | Данные Allure | 7 дней |
| Скриншоты | При падении тестов | 7 дней |
| Видео | При retry (кроме Safari) | 7 дней |

---

## Известные ограничения

| Проблема | Влияние | Решение |
|----------|---------|---------|
| Firefox: Clipboard API ограничен | Средний | Fallback через `document.execCommand('copy')` |
| Mobile Safari: нет записи видео | Низкий | Используются только скриншоты |
| Firefox: `isMobile` не поддерживается | Низкий | Device-тесты пропускаются в Firefox |
| Динамический контент | Средний | Явные ожидания (`waitForSelector`, `waitForLoadState`) |
