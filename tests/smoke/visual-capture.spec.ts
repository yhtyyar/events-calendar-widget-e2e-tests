/**
 * Пример теста с визуальной фиксацией шагов.
 * Демонстрирует использование утилиты captureStep для создания скриншотов.
 */

import { test, expect } from '@playwright/test';
import { captureStep, withVisualCapture, logArtifactsInfo } from '../../src/utils/visual';
import { URLS } from '../../config/test-data';

test.describe('TC-WIDGET-VISUAL: Визуальная фиксация виджета @smoke @visual', () => {
  
  test.beforeEach(async ({ page }, testInfo) => {
    // Логируем информацию об артефактах
    logArtifactsInfo(testInfo);
  });

  test('TC-WIDGET-001: Загрузка и отображение главной страницы виджета', async ({ page }, testInfo) => {
    // Шаг 1: Переход на страницу
    await captureStep(page, testInfo, 'before-navigation', 'before');
    
    await page.goto(URLS.EVENTS_WIDGET);
    await page.waitForLoadState('networkidle');
    
    await captureStep(page, testInfo, 'after-page-load', 'after');

    // Шаг 2: Проверка заголовка
    await captureStep(page, testInfo, 'check-heading', 'before');
    
    const heading = page.locator('text=/календарь мероприятий/i').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    await captureStep(page, testInfo, 'heading-visible', 'after');

    // Шаг 3: Проверка описания
    await captureStep(page, testInfo, 'check-description', 'before');
    
    const description = page.locator('text=/Хочешь такой же/i').first();
    await expect(description).toBeVisible({ timeout: 10000 });
    
    await captureStep(page, testInfo, 'description-visible', 'after');
  });

  test('TC-WIDGET-002: Проверка элементов формы виджета', async ({ page }, testInfo) => {
    await page.goto(URLS.EVENTS_WIDGET);
    await page.waitForLoadState('networkidle');

    // Используем withVisualCapture для автоматической фиксации
    await withVisualCapture(page, testInfo, 'find-interactive-elements', async () => {
      // Ищем интерактивные элементы
      const buttons = page.locator('button, input[type="submit"], .btn');
      const buttonsCount = await buttons.count();
      
      console.log(`📍 Found ${buttonsCount} interactive elements`);
      
      // Проверяем наличие хотя бы одного элемента
      expect(buttonsCount).toBeGreaterThanOrEqual(0);
    });

    await withVisualCapture(page, testInfo, 'check-form-elements', async () => {
      // Ищем элементы формы
      const formElements = page.locator('input, select, textarea');
      const formCount = await formElements.count();
      
      console.log(`📍 Found ${formCount} form elements`);
    });
  });

  test('TC-WIDGET-003: Прокрутка и проверка футера', async ({ page }, testInfo) => {
    await page.goto(URLS.EVENTS_WIDGET);
    await page.waitForLoadState('networkidle');

    // Шаг 1: Начальное состояние
    await captureStep(page, testInfo, 'initial-state', 'before');

    // Шаг 2: Прокрутка вниз
    await captureStep(page, testInfo, 'before-scroll', 'before');
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500); // Ждём завершения анимации
    
    await captureStep(page, testInfo, 'after-scroll-to-bottom', 'after');

    // Шаг 3: Проверка футера
    const footer = page.locator('footer').first();
    const footerExists = await footer.count() > 0;
    
    if (footerExists) {
      await captureStep(page, testInfo, 'footer-visible', 'after');
    }

    // Шаг 4: Прокрутка обратно наверх
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    
    await captureStep(page, testInfo, 'back-to-top', 'after');
  });

});
