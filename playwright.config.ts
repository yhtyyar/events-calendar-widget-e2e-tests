import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const isCI = !!process.env.CI;

// Теги для критических сценариев с видеозаписью
const CRITICAL_VIDEO_TAGS = ['@video', '@critical', '@auth', '@payment'];

// Функция для генерации структурированного имени скриншота
function generateScreenshotPath(testInfo: { title: string; project: { name: string }; file: string }): string {
  const category = testInfo.file.includes('/smoke/') ? 'smoke' :
                   testInfo.file.includes('/functional/') ? 'functional' :
                   testInfo.file.includes('/visual/') ? 'visual' :
                   testInfo.file.includes('/accessibility/') ? 'accessibility' : 'other';
  
  const browser = testInfo.project.name || 'unknown';
  const testId = testInfo.title.match(/^([A-Z]+-\d+)/)?.[1] || 'TEST';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  return path.join('reports', 'screenshots', category, browser, `${testId}_ошибка_${timestamp}.png`);
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1, // Добавляем retry для локального запуска для борьбы с флаки
  workers: isCI ? 2 : undefined,

  reporter: isCI
    ? [
        ['github'],
        ['json', { outputFile: 'reports/results.json' }],
        ['html', { outputFolder: 'reports/html', open: 'never' }],
        ['allure-playwright', { 
          outputFolder: 'allure-results',
          detail: true,
          suiteTitle: true,
          categories: [
            {
              name: 'Нестабильные тесты',
              matchedStatuses: ['broken'],
              messageRegex: '.*timeout.*|.*flaky.*',
            },
            {
              name: 'Элемент не найден',
              matchedStatuses: ['failed'],
              messageRegex: '.*locator.*|.*selector.*|.*element.*',
            },
            {
              name: 'Сетевые ошибки',
              matchedStatuses: ['broken'],
              messageRegex: '.*network.*|.*fetch.*|.*ERR_.*',
            },
            {
              name: 'Ошибки валидации',
              matchedStatuses: ['failed'],
              messageRegex: '.*expect.*|.*assertion.*|.*toBe.*',
            },
          ],
          environmentInfo: {
            'Версия Node': process.version,
            'Операционная система': process.platform,
            'Базовый URL': process.env.BASE_URL || 'https://dev.3snet.info',
            'Окружение': isCI ? 'CI/CD' : 'Локальное',
          },
        }],
      ]
    : [
        ['html', { outputFolder: 'reports/html', open: 'never' }],
        ['allure-playwright', { 
          outputFolder: 'allure-results',
          detail: true,
          suiteTitle: true,
          environmentInfo: {
            'Версия Node': process.version,
            'Операционная система': process.platform,
            'Базовый URL': process.env.BASE_URL || 'https://dev.3snet.info',
            'Окружение': isCI ? 'CI/CD' : 'Локальное',
          },
        }],
        ['list'],
      ],

  outputDir: 'reports/artifacts',

  use: {
    baseURL: process.env.BASE_URL || 'https://dev.3snet.info',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Видео отключено глобально, включается через проекты для критических тестов
    video: 'off',
    ignoreHTTPSErrors: true,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    // Улучшенные настройки для стабильности
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // Desktop browsers (P0)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1920, height: 1080 } },
    },
    // Mobile (P1)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    // Критические тесты с видеозаписью
    {
      name: 'critical-with-video',
      grep: /@video|@critical|@auth|@payment/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        video: {
          mode: 'on',
          size: { width: 1920, height: 1080 },
        },
      },
    },
  ],

  // Глобальные хуки
  globalSetup: undefined,
  globalTeardown: undefined,
});
