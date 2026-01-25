# Руководство по участию в проекте

## Начало работы

### Требования
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/yhtyyar/events-calendar-widget-e2e-tests.git
cd events-calendar-widget-e2e-tests

# Установка зависимостей
npm install

# Установка браузеров Playwright
npx playwright install
```

## Разработка

### Структура веток

- `main` — стабильная версия
- `develop` — ветка разработки
- `feature/*` — новый функционал
- `fix/*` — исправления

### Создание новой ветки

```bash
git checkout -b feature/new-test-case
```

## Написание тестов

### Соглашения об именовании

- Файлы тестов: `*.spec.ts`
- ID тестов: `CATEGORY-NN` (например, `SMOKE-01`, `FUNC-05`)
- Теги: `@smoke`, `@functional`, `@visual`, `@accessibility`
- Приоритеты: `@P0`, `@P1`, `@P2`

### Шаблон теста

```typescript
import { test, expect } from '@playwright/test';
import { EventsWidgetPage } from '../../src/pages/EventsWidgetPage';

test.describe('Категория @tag @priority', () => {
  let widgetPage: EventsWidgetPage;

  test.beforeEach(async ({ page }) => {
    widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
  });

  test('ID: Описание теста', async ({ page }) => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Page Object

При добавлении новых элементов:

1. Добавить селектор в `src/utils/selectors.ts`
2. Добавить локатор в Page Object
3. Создать метод взаимодействия

## Стиль кода

### Линтинг

```bash
# Проверка
npm run lint

# Автоисправление
npm run lint:fix
```

### Форматирование

```bash
# Проверка
npm run format:check

# Автоформатирование
npm run format
```

## Коммиты

### Формат сообщения

```
type(scope): описание

[тело сообщения]
```

### Типы коммитов

| Тип | Описание |
|-----|----------|
| `feat` | Новый функционал |
| `fix` | Исправление бага |
| `docs` | Документация |
| `refactor` | Рефакторинг кода |
| `test` | Добавление тестов |
| `chore` | Настройка, зависимости |

### Примеры

```bash
feat(smoke): добавлены тесты проверки заголовка страницы
fix(clipboard): исправлен fallback для Firefox
docs(readme): обновлены инструкции по запуску
refactor(pages): выделен базовый класс BasePage
```

## Pull Request

### Чек-лист перед PR

- [ ] Тесты проходят локально: `npm test`
- [ ] Линтер не выдает ошибок: `npm run lint`
- [ ] Код отформатирован: `npm run format`
- [ ] Добавлена документация (если нужно)
- [ ] Обновлен KNOWN_ISSUES.md (если есть ограничения)

### Описание PR

```markdown
## Описание
Краткое описание изменений

## Тип изменений
- [ ] Новый функционал
- [ ] Исправление бага
- [ ] Документация
- [ ] Рефакторинг

## Тестирование
Как проверить изменения

## Связанные issues
Closes #123
```

## Запуск тестов

```bash
# Все тесты
npm test

# Конкретная категория
npm run test:smoke

# Конкретный браузер
npm run test:chrome

# С отображением браузера
npm run test:headed

# Режим отладки
npm run test:debug
```

## Отчеты

```bash
# Открыть HTML-отчет
npm run report
```

## Вопросы

При возникновении вопросов:
1. Проверьте документацию в папке `docs/`
2. Посмотрите существующие тесты как примеры
3. Создайте issue в репозитории
