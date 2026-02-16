/**
 * Allure Test Fixtures
 * 
 * Этот файл содержит расширенные фикстуры для интеграции Playwright с Allure.
 * Автоматически добавляет скриншоты, видео, логи и шаги в Allure отчёты.
 */

import { test as base, expect, TestInfo } from '@playwright/test';
import { allure } from 'allure-playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Расширенный test с интеграцией Allure
 */
export const test = base.extend<{
  allureStep: (name: string, action: () => Promise<void>) => Promise<void>;
  allureAttachment: (name: string, content: Buffer | string, type: string) => void;
}>({
  /**
   * Фикстура для создания Allure шагов
   */
  allureStep: async ({}, use) => {
    await use(async (name: string, action: () => Promise<void>) => {
      await allure.step(name, async () => {
        await action();
      });
    });
  },

  /**
   * Фикстура для добавления вложений
   */
  allureAttachment: async ({}, use) => {
    await use((name: string, content: Buffer | string, type: string) => {
      allure.attachment(name, content, { contentType: type });
    });
  },
});

/**
 * Глобальный afterEach hook для автоматического прикрепления артефактов к Allure
 */
test.afterEach(async ({}, testInfo: TestInfo) => {
  // Добавляем метки в Allure
  allure.tag(testInfo.project.name);
  allure.label('browser', testInfo.project.name);
  allure.label('testId', testInfo.title.match(/^([A-Z]+-\d+)/)?.[1] || 'UNKNOWN');

  // Прикрепляем скриншоты, если тест упал
  if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
    // Скриншоты Playwright
    const screenshotPath = testInfo.outputPath('test-failed-1.png');
    if (fs.existsSync(screenshotPath)) {
      const screenshot = fs.readFileSync(screenshotPath);
      allure.attachment(
        '📸 Screenshot on Failure',
        screenshot,
        { contentType: 'image/png' }
      );
    }

    // Видео если есть
    if (testInfo.attachments.length > 0) {
      for (const attachment of testInfo.attachments) {
        if (attachment.contentType?.startsWith('video/')) {
          const videoPath = attachment.path;
          if (videoPath && fs.existsSync(videoPath)) {
            const video = fs.readFileSync(videoPath);
            allure.attachment(
              '🎥 Video Recording',
              video,
              { contentType: 'video/webm' }
            );
          }
        }
      }
    }

    // Логи консоли браузера
    const logPath = testInfo.outputPath('browser-console.log');
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf-8');
      allure.attachment(
        '🌐 Browser Console Logs',
        Buffer.from(logs),
        { contentType: 'text/plain' }
      );
    }

    // Trace файл
    const tracePath = testInfo.outputPath('trace.zip');
    if (fs.existsSync(tracePath)) {
      const trace = fs.readFileSync(tracePath);
      allure.attachment(
        '🔍 Playwright Trace',
        trace,
        { contentType: 'application/zip' }
      );
    }
  }

  // Добавляем скриншот успешного состояния для всех тестов (опционально)
  if (testInfo.status === 'passed') {
    // Можно добавить скриншот успешного прохождения
    // const screenshotPath = testInfo.outputPath('test-success.png');
    // if (fs.existsSync(screenshotPath)) {
    //   const screenshot = fs.readFileSync(screenshotPath);
    //   allure.attachment('✅ Success Screenshot', screenshot, 'image/png');
    // }
  }
});

/**
 * Хелпер для создания именованного шага с автоматическим скриншотом
 */
export async function allureStepWithScreenshot(
  stepName: string,
  page: any,
  action: () => Promise<void>
): Promise<void> {
  await allure.step(stepName, async () => {
    // Добавляем скриншот ДО действия
    const beforeScreenshot = await page.screenshot({ fullPage: false });
    allure.attachment(
      `📸 Before: ${stepName}`,
      beforeScreenshot,
      { contentType: 'image/png' }
    );

    // Выполняем действие
    await action();

    // Добавляем скриншот ПОСЛЕ действия
    const afterScreenshot = await page.screenshot({ fullPage: false });
    allure.attachment(
      `📸 After: ${stepName}`,
      afterScreenshot,
      { contentType: 'image/png' }
    );
  });
}

/**
 * Хелпер для добавления описания теста
 */
export function allureDescription(description: string): void {
  allure.description(description);
}

/**
 * Хелпер для добавления серьезности теста
 */
export function allureSeverity(severity: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial'): void {
  allure.severity(severity);
}

/**
 * Хелпер для добавления функциональности/фичи
 */
export function allureFeature(feature: string): void {
  allure.feature(feature);
}

/**
 * Хелпер для добавления истории/стори
 */
export function allureStory(story: string): void {
  allure.story(story);
}

/**
 * Хелпер для добавления ссылки на issue/TestCase
 */
export function allureIssue(url: string, name?: string): void {
  allure.issue(url, name || 'Issue');
}

/**
 * Хелпер для добавления ссылки на TestRail/TMS
 */
export function allureTestCase(url: string, name?: string): void {
  allure.testCase(url, name || 'Test Case');
}

/**
 * Хелпер для добавления метки
 */
export function allureTag(tag: string): void {
  allure.tag(tag);
}

/**
 * Хелпер для добавления метаданных окружения
 */
export function allureEnvironment(name: string, value: string): void {
  allure.parameter(name, value);
}

export { expect } from '@playwright/test';
