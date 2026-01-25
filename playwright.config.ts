import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация Playwright для E2E тестирования виджета календаря мероприятий.
 * Поддерживает кросс-браузерное тестирование и различные устройства.
 */
export default defineConfig({
  // Директория с тестами
  testDir: './tests',

  // Максимальное время выполнения одного теста
  timeout: 30000,

  // Максимальное время ожидания для expect assertions
  expect: {
    timeout: 10000,
  },

  // Полный параллелизм на CI, последовательное выполнение локально для отладки
  fullyParallel: true,

  // Запрет .only на CI для предотвращения случайного пропуска тестов
  forbidOnly: !!process.env.CI,

  // Количество повторных попыток при падении теста
  retries: process.env.CI ? 2 : 0,

  // Количество параллельных воркеров
  workers: process.env.CI ? 1 : undefined,

  // Конфигурация репортеров
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],

  // Общие настройки для всех проектов
  use: {
    // Базовый URL тестируемого приложения
    baseURL: 'https://dev.3snet.info',

    // Сбор трейсов при первой повторной попытке
    trace: 'on-first-retry',

    // Скриншоты при падении теста
    screenshot: 'only-on-failure',

    // Запись видео при повторных попытках
    video: 'on-first-retry',

    // Игнорировать HTTPS ошибки
    ignoreHTTPSErrors: true,

    // Локаль для браузера
    locale: 'ru-RU',

    // Таймзона
    timezoneId: 'Europe/Moscow',
  },

  // Проекты для различных браузеров и устройств
  projects: [
    // Десктопные браузеры
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Мобильные устройства
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Планшеты
    {
      name: 'iPad',
      use: { ...devices['iPad Pro 11'] },
    },
  ],

  // Директория для артефактов (скриншоты, видео, трейсы)
  outputDir: 'reports/artifacts',
});
