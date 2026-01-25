# Архитектура тестового фреймворка

## 1. Обзор

Тестовый фреймворк построен на базе Playwright Test Runner с использованием TypeScript. Архитектура следует паттерну Page Object Model (POM) и принципам SOLID.

---

## 2. Структура проекта

```
events-calendar-widget-e2e-tests/
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI/CD
├── config/
│   └── test-data.ts                # Константы и тестовые данные
├── src/
│   ├── pages/
│   │   ├── BasePage.ts             # Базовый класс страниц
│   │   └── EventsWidgetPage.ts     # Page Object виджета
│   ├── utils/
│   │   ├── helpers.ts              # Вспомогательные функции
│   │   ├── selectors.ts            # Централизованные селекторы
│   │   ├── logger.ts               # Модуль логирования
│   │   └── errorHandler.ts         # Обработка ошибок
│   └── fixtures/
│       └── eventsWidgetFixture.ts  # Кастомные фикстуры
├── tests/
│   ├── smoke/                      # Smoke-тесты
│   ├── functional/                 # Функциональные тесты
│   ├── visual/                     # Визуальные тесты
│   └── accessibility/              # Тесты доступности
├── docs/
│   ├── TEST_PLAN.md
│   ├── TEST_CASES.md
│   ├── ARCHITECTURE.md
│   └── KNOWN_ISSUES.md
├── playwright.config.ts            # Конфигурация Playwright
├── tsconfig.json                   # Конфигурация TypeScript
├── package.json
└── README.md
```

---

## 3. Архитектурные паттерны

### 3.1 Page Object Model (POM)

#### Базовый класс `BasePage`
```typescript
abstract class BasePage {
  protected readonly page: Page;
  
  abstract getPath(): string;
  
  async navigate(): Promise<void>;
  async isElementVisible(locator: Locator): Promise<boolean>;
  async hasNoHorizontalScroll(): Promise<boolean>;
}
```

**Преимущества:**
- Инкапсуляция локаторов и действий
- Переиспользование общих методов
- Единое место для изменений при обновлении UI

#### Конкретный Page Object `EventsWidgetPage`
```typescript
class EventsWidgetPage extends BasePage {
  private readonly mainHeading: Locator;
  private readonly embedCodeField: Locator;
  
  async isMainHeadingVisible(): Promise<boolean>;
  async getEmbedCode(): Promise<string>;
  async isEmbedCodeValid(): Promise<boolean>;
}
```

### 3.2 Стратегия селекторов

Приоритет выбора селекторов:
1. **data-testid** — наиболее стабильные
2. **Роли и ARIA** — семантически значимые
3. **Текстовое содержимое** — для стабильного текста
4. **CSS-селекторы** — как fallback

Централизованное хранение в `selectors.ts`:
```typescript
export const SELECTORS = {
  WIDGET: {
    HEADING: 'text="Нравится наш календарь мероприятий?"',
    HEADING_PARTIAL: 'text=/календарь мероприятий/i',
  },
};
```

### 3.3 Фикстуры

Расширение базовых фикстур Playwright:
```typescript
export const test = base.extend<EventsWidgetFixtures>({
  eventsWidgetPage: async ({ page }, use) => {
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
    await use(widgetPage);
  },
});
```

---

## 4. Стратегия ожиданий

### Приоритет методов ожидания

1. **`waitForLoadState('networkidle')`** — для загрузки страницы
2. **`locator.waitFor({ state: 'visible' })`** — для элементов
3. **`expect().toBeVisible()`** — для проверок
4. **`waitForTimeout()`** — только для анимаций (избегать)

### Пример реализации
```typescript
async waitForPageReady(page: Page): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    // Fallback на domcontentloaded
    await page.waitForLoadState('domcontentloaded');
  }
}
```

---

## 5. Обработка ошибок

### Централизованный обработчик

```typescript
enum TestErrorType {
  ELEMENT_NOT_FOUND,
  TIMEOUT,
  NETWORK_ERROR,
  CLIPBOARD_ERROR,
}

async function handleTestError(
  error: Error,
  page: Page,
  testInfo: TestInfo
): Promise<void> {
  // Классификация ошибки
  const testError = createTestError(error);
  
  // Сбор диагностики
  const diagnostics = await collectDiagnostics(page);
  
  // Скриншот и логирование
  await testInfo.attach('error-screenshot', { ... });
}
```

### Retry-логика
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await delay(1000);
    }
  }
}
```

---

## 6. Fallback-стратегии

### Копирование в буфер обмена

Firefox имеет ограничения с Clipboard API. Реализована многоуровневая стратегия:

```typescript
async copyToClipboard(page: Page, text: string): Promise<boolean> {
  // Стратегия 1: Clipboard API
  try {
    await context.grantPermissions(['clipboard-write']);
    await page.evaluate((t) => navigator.clipboard.writeText(t), text);
    return true;
  } catch { }

  // Стратегия 2: execCommand (deprecated, но совместимый)
  try {
    await page.evaluate((t) => {
      const textarea = document.createElement('textarea');
      textarea.value = t;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }, text);
    return true;
  } catch { }

  return false;
}
```

---

## 7. Конфигурация

### Playwright Config
```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

### Артефакты
- **Скриншоты**: При падении тестов
- **Видео**: При повторных попытках
- **Трейсы**: При первой повторной попытке
- **HTML-отчет**: Всегда

---

## 8. CI/CD интеграция

### GitHub Actions Pipeline

```yaml
jobs:
  test:
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - Install dependencies
      - Install Playwright browsers
      - Run tests
      - Upload artifacts
```

### Параллелизация
- Параллельные джобы по браузерам
- Отдельная джоба для мобильных тестов
- Сводный отчет после всех тестов

---

## 9. Расширяемость

### Добавление нового Page Object

1. Создать класс, наследующий `BasePage`
2. Реализовать метод `getPath()`
3. Добавить локаторы и методы взаимодействия
4. Зарегистрировать в фикстурах (опционально)

### Добавление нового теста

1. Создать файл в соответствующей директории (`tests/smoke/`, `tests/functional/` и т.д.)
2. Использовать теги для категоризации (`@smoke`, `@P0`)
3. Следовать соглашению об именовании: `ID: Название`

---

## 10. Принципы разработки

1. **SOLID** — Каждый класс имеет одну ответственность
2. **DRY** — Общие методы в базовых классах
3. **KISS** — Простые решения без over-engineering
4. **Явные ожидания** — Избегать `waitForTimeout()`
5. **Изоляция тестов** — Тесты независимы друг от друга
6. **Централизация** — Селекторы, данные, конфиги в одном месте

---

*Документ версии 1.0*
