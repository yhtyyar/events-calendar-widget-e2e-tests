import { Page, BrowserContext } from '@playwright/test';
import { TIMEOUTS } from '../../config/test-data';
import { logger } from './logger';

/**
 * Вспомогательные функции для тестов.
 * Содержит общие утилиты, используемые в различных тестах и Page Objects.
 */

/**
 * Ожидание полной загрузки страницы.
 * Использует комбинацию стратегий для надежного определения готовности.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  const log = logger.child('waitForPageReady');
  
  try {
    // Ожидаем завершения сетевых запросов
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.PAGE_LOAD });
    log.debug('networkidle достигнут');
  } catch {
    // Если networkidle не достигнут, пробуем domcontentloaded
    log.warn('networkidle таймаут, используем domcontentloaded');
    await page.waitForLoadState('domcontentloaded');
  }
  
  // Дополнительная проверка на отсутствие индикаторов загрузки
  const loadingIndicators = await page.locator('.loading, .spinner, [aria-busy="true"]').count();
  if (loadingIndicators > 0) {
    log.debug('Обнаружены индикаторы загрузки, ожидаем их исчезновения');
    await page.waitForSelector('.loading, .spinner, [aria-busy="true"]', {
      state: 'hidden',
      timeout: TIMEOUTS.DEFAULT,
    }).catch(() => {
      log.warn('Индикаторы загрузки не исчезли в течение таймаута');
    });
  }
}

/**
 * Безопасное получение текста элемента.
 * Возвращает null если элемент не найден.
 */
export async function safeGetText(page: Page, selector: string): Promise<string | null> {
  try {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible().catch(() => false);
    
    if (!isVisible) {
      return null;
    }
    
    return await element.textContent();
  } catch {
    return null;
  }
}

/**
 * Проверка наличия горизонтального скролла.
 * Используется для тестирования адаптивности.
 */
export async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

/**
 * Получение размера viewport.
 */
export async function getViewportSize(page: Page): Promise<{ width: number; height: number }> {
  return page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
}

/**
 * Копирование текста в буфер обмена с fallback стратегией.
 * Учитывает особенности различных браузеров.
 */
export async function copyToClipboard(
  page: Page,
  context: BrowserContext,
  text: string
): Promise<boolean> {
  const log = logger.child('copyToClipboard');

  // Стратегия 1: Использование Clipboard API (современные браузеры)
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await page.evaluate(async (textToCopy) => {
      await navigator.clipboard.writeText(textToCopy);
    }, text);
    
    log.debug('Копирование через Clipboard API успешно');
    return true;
  } catch (error) {
    log.warn('Clipboard API недоступен, пробуем fallback', error);
  }

  // Стратегия 2: Fallback через execCommand (устаревший, но совместимый)
  try {
    await page.evaluate((textToCopy) => {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }, text);
    
    log.debug('Копирование через execCommand успешно');
    return true;
  } catch (error) {
    log.error('Все стратегии копирования завершились неудачей', error);
    return false;
  }
}

/**
 * Чтение текста из буфера обмена.
 */
export async function readFromClipboard(
  page: Page,
  context: BrowserContext
): Promise<string | null> {
  const log = logger.child('readFromClipboard');
  
  try {
    await context.grantPermissions(['clipboard-read']);
    
    const clipboardText = await page.evaluate(async () => {
      return navigator.clipboard.readText();
    });
    
    log.debug('Чтение из буфера успешно');
    return clipboardText;
  } catch (error) {
    log.warn('Не удалось прочитать буфер обмена', error);
    return null;
  }
}

/**
 * Замер времени выполнения операции.
 */
export async function measureExecutionTime<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; durationMs: number }> {
  const log = logger.child('measureExecutionTime');
  const startTime = Date.now();
  
  const result = await operation();
  const durationMs = Date.now() - startTime;
  
  log.debug(`${operationName}: ${durationMs}ms`);
  
  return { result, durationMs };
}

/**
 * Retry-обертка для нестабильных операций.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, operationName = 'операция' } = options;
  const log = logger.child('withRetry');
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log.warn(`Попытка ${attempt}/${maxAttempts} для "${operationName}" завершилась неудачей`);
      
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
}

/**
 * Генерация уникального идентификатора для тестовых данных.
 */
export function generateTestId(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}
