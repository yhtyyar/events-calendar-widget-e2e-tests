import { Page, Locator, expect } from '@playwright/test';
import { logger } from './logger';

// Локальные константы таймаутов для избежания проблем с типами
const DEFAULT_TIMEOUT = 5000;
const PAGE_LOAD_TIMEOUT = 15000;
const NETWORK_TIMEOUT = 10000;

/**
 * Утилиты для явных ожиданий.
 * Заменяют использование browser.pause() на надежные ожидания.
 */

const log = logger.child('waitUtils');

// ============ ОЖИДАНИЕ ЭЛЕМЕНТОВ ============

/**
 * Ожидает появления элемента и его готовности к взаимодействию
 */
export async function waitForElementReady(
  page: Page,
  selector: string,
  options: {
    timeout?: number;
    state?: 'visible' | 'attached' | 'hidden' | 'detached';
  } = {}
): Promise<Locator> {
  const { timeout = DEFAULT_TIMEOUT, state = 'visible' } = options;
  const locator = page.locator(selector).first();
  
  await locator.waitFor({ state, timeout });
  log.debug(`Элемент ${selector} готов (${state})`);
  
  return locator;
}

/**
 * Ожидает появления элемента с retry
 */
export async function waitForElementWithRetry(
  page: Page,
  selector: string,
  options: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<Locator> {
  const { timeout = DEFAULT_TIMEOUT, retries = 3, retryDelay = 500 } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'visible', timeout: timeout / retries });
      return locator;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log.warn(`Попытка ${attempt}/${retries} ожидания ${selector} неудачна`);
      
      if (attempt < retries) {
        await page.waitForTimeout(retryDelay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Ожидает исчезновения элемента
 */
export async function waitForElementHidden(
  page: Page,
  selector: string,
  timeout = DEFAULT_TIMEOUT
): Promise<void> {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'hidden', timeout });
  log.debug(`Элемент ${selector} скрыт`);
}

/**
 * Ожидает пока элемент станет кликабельным
 */
export async function waitForClickable(
  page: Page,
  selector: string,
  timeout = DEFAULT_TIMEOUT
): Promise<Locator> {
  const locator = page.locator(selector).first();
  
  await locator.waitFor({ state: 'visible', timeout });
  await expect(locator).toBeEnabled({ timeout });
  
  log.debug(`Элемент ${selector} кликабелен`);
  return locator;
}

// ============ ОЖИДАНИЕ СОСТОЯНИЙ ============

/**
 * Ожидает выполнения условия
 */
export async function waitForCondition(
  page: Page,
  condition: () => Promise<boolean> | boolean,
  options: {
    timeout?: number;
    interval?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> {
  const { 
    timeout = DEFAULT_TIMEOUT, 
    interval = 100,
    timeoutMessage = 'Условие не выполнено в течение таймаута'
  } = options;
  
  await page.waitForFunction(
    async (conditionFn: () => boolean | Promise<boolean>) => conditionFn(),
    condition,
    { timeout, polling: interval }
  ).catch(async () => {
    // Fallback через цикл
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await page.waitForTimeout(interval);
    }
    throw new Error(timeoutMessage);
  });
}

/**
 * Ожидает пока элемент будет содержать текст
 */
export async function waitForText(
  page: Page,
  selector: string,
  text: string,
  options: {
    timeout?: number;
    exact?: boolean;
  } = {}
): Promise<void> {
  const { timeout = DEFAULT_TIMEOUT, exact = false } = options;
  const locator = page.locator(selector).first();
  
  if (exact) {
    await expect(locator).toHaveText(text, { timeout });
  } else {
    await expect(locator).toContainText(text, { timeout });
  }
  
  log.debug(`Текст "${text}" найден в ${selector}`);
}

/**
 * Ожидает пока input будет содержать значение
 */
export async function waitForInputValue(
  page: Page,
  selector: string,
  value: string,
  timeout = DEFAULT_TIMEOUT
): Promise<void> {
  const locator = page.locator(selector).first();
  await expect(locator).toHaveValue(value, { timeout });
  log.debug(`Значение "${value}" установлено в ${selector}`);
}

/**
 * Ожидает изменения URL
 */
export async function waitForUrlChange(
  page: Page,
  options: {
    contains?: string;
    matches?: RegExp;
    timeout?: number;
  } = {}
): Promise<string> {
  const { contains, matches, timeout = PAGE_LOAD_TIMEOUT } = options;
  
  if (contains) {
    await page.waitForURL(`**/*${contains}*`, { timeout });
  } else if (matches) {
    await page.waitForURL(matches, { timeout });
  } else {
    await page.waitForURL('**', { timeout });
  }
  
  const newUrl = page.url();
  log.debug(`URL изменен на: ${newUrl}`);
  return newUrl;
}

// ============ ОЖИДАНИЕ СЕТИ ============

/**
 * Ожидает завершения всех сетевых запросов
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout = NETWORK_TIMEOUT
): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
    log.debug('Сеть неактивна');
  } catch {
    log.warn('networkidle таймаут, продолжаем');
  }
}

/**
 * Ожидает определенный сетевой запрос
 */
export async function waitForRequest(
  page: Page,
  urlPattern: string | RegExp,
  timeout = NETWORK_TIMEOUT
): Promise<void> {
  await page.waitForRequest(urlPattern, { timeout });
  log.debug(`Запрос к ${urlPattern} выполнен`);
}

/**
 * Ожидает ответ от определенного endpoint
 */
export async function waitForResponse(
  page: Page,
  urlPattern: string | RegExp,
  options: {
    timeout?: number;
    status?: number;
  } = {}
): Promise<void> {
  const { timeout = NETWORK_TIMEOUT, status } = options;
  
  const response = await page.waitForResponse(
    (resp) => {
      const urlMatch = typeof urlPattern === 'string' 
        ? resp.url().includes(urlPattern)
        : urlPattern.test(resp.url());
      const statusMatch = status ? resp.status() === status : true;
      return urlMatch && statusMatch;
    },
    { timeout }
  );
  
  log.debug(`Ответ от ${urlPattern}: ${response.status()}`);
}

// ============ ОЖИДАНИЕ UI СОСТОЯНИЙ ============

/**
 * Ожидает исчезновения индикатора загрузки
 */
export async function waitForLoadingComplete(
  page: Page,
  options: {
    timeout?: number;
    loadingSelectors?: string[];
  } = {}
): Promise<void> {
  const { 
    timeout = DEFAULT_TIMEOUT,
    loadingSelectors = [
      '[data-testid="loading-spinner"]',
      '[data-testid="loading-overlay"]',
      '.loading',
      '.spinner',
      '[aria-busy="true"]',
    ]
  } = options;
  
  for (const selector of loadingSelectors) {
    const locator = page.locator(selector);
    const count = await locator.count();
    
    if (count > 0) {
      await locator.first().waitFor({ state: 'hidden', timeout }).catch(() => {
        log.warn(`Индикатор загрузки ${selector} не исчез`);
      });
    }
  }
  
  log.debug('Загрузка завершена');
}

/**
 * Ожидает появления модального окна
 */
export async function waitForModal(
  page: Page,
  timeout = DEFAULT_TIMEOUT
): Promise<Locator> {
  const modalSelectors = [
    '[data-testid="modal"]',
    '[role="dialog"]',
    '.modal',
    '.dialog',
  ];
  
  for (const selector of modalSelectors) {
    const locator = page.locator(selector).first();
    try {
      await locator.waitFor({ state: 'visible', timeout: timeout / modalSelectors.length });
      log.debug(`Модальное окно найдено: ${selector}`);
      return locator;
    } catch {
      // Пробуем следующий селектор
    }
  }
  
  throw new Error('Модальное окно не найдено');
}

/**
 * Ожидает закрытия модального окна
 */
export async function waitForModalClosed(
  page: Page,
  timeout = DEFAULT_TIMEOUT
): Promise<void> {
  const modalSelectors = [
    '[data-testid="modal"]',
    '[role="dialog"]',
    '.modal.show',
    '.modal.visible',
  ];
  
  for (const selector of modalSelectors) {
    const locator = page.locator(selector);
    if (await locator.count() > 0) {
      await locator.first().waitFor({ state: 'hidden', timeout }).catch(() => {});
    }
  }
  
  log.debug('Модальное окно закрыто');
}

// ============ КОМБИНИРОВАННЫЕ ОЖИДАНИЯ ============

/**
 * Ожидает готовности страницы (DOM + сеть + загрузка)
 */
export async function waitForPageReady(
  page: Page,
  timeout = PAGE_LOAD_TIMEOUT
): Promise<void> {
  await page.waitForLoadState('domcontentloaded', { timeout });
  await waitForNetworkIdle(page, timeout);
  await waitForLoadingComplete(page, { timeout });
  log.debug('Страница готова');
}

/**
 * Ожидает стабилизации UI (без изменений в течение заданного времени)
 */
export async function waitForUIStable(
  page: Page,
  options: {
    selector?: string;
    stabilityTime?: number;
    timeout?: number;
  } = {}
): Promise<void> {
  const { 
    selector = 'body', 
    stabilityTime = 500, 
    timeout = DEFAULT_TIMEOUT 
  } = options;
  
  const startTime = Date.now();
  let lastHtml = '';
  let stableFrom = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const currentHtml = await page.locator(selector).innerHTML().catch(() => '');
    
    if (currentHtml === lastHtml) {
      if (Date.now() - stableFrom >= stabilityTime) {
        log.debug('UI стабилизировался');
        return;
      }
    } else {
      lastHtml = currentHtml;
      stableFrom = Date.now();
    }
    
    await page.waitForTimeout(100);
  }
  
  log.warn('UI не стабилизировался в течение таймаута');
}
