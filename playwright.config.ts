import { defineConfig, devices } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Конфигурация Playwright для E2E тестирования виджета календаря мероприятий.
 * Поддерживает кросс-браузерное тестирование и различные устройства.
 * Включает настройки визуальной фиксации результатов.
 */

// Директория для всех артефактов тестирования
const ARTIFACTS_DIR = join(process.cwd(), 'test-artifacts');

// Создаём папку для артефактов при запуске (если не существует)
try {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
} catch {
  // Папка уже существует или нет прав
}

// Генерируем уникальный ID для прогона тестов
const TEST_RUN_ID = `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
process.env.TEST_RUN_ID = TEST_RUN_ID;

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
    ['html', { 
      outputFolder: `${ARTIFACTS_DIR}/html-report`, 
      open: 'never' // Отключаем автоматическое открытие в CI
    }],
    ['json', { outputFile: `${ARTIFACTS_DIR}/results.json` }],
    ['list'],
  ],

  // Общие настройки для всех проектов
  use: {
    // Базовый URL тестируемого приложения
    baseURL: 'https://dev.3snet.info',

    // Сбор трейсов при первой повторной попытке
    trace: 'on-first-retry',

    // Скриншоты всегда (для визуальной фиксации шагов)
    screenshot: 'on',

    // Видео только для упавших тестов (экономия места)
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },

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
  outputDir: `${ARTIFACTS_DIR}/screenshots`,
});
