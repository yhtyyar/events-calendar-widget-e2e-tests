import { Page, TestInfo } from '@playwright/test';
import { logger } from './logger';

/**
 * Централизованный обработчик ошибок для тестов.
 * Обеспечивает сбор диагностической информации при падениях.
 */

// Типы ошибок тестирования
export enum TestErrorType {
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  ASSERTION_FAILED = 'ASSERTION_FAILED',
  CLIPBOARD_ERROR = 'CLIPBOARD_ERROR',
  UNKNOWN = 'UNKNOWN',
}

// Интерфейс для структурированной ошибки
export interface TestError {
  type: TestErrorType;
  message: string;
  selector?: string;
  url?: string;
  timestamp: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Классификация ошибки по её содержимому
 */
export function classifyError(error: Error): TestErrorType {
  const message = error.message.toLowerCase();
  
  if (message.includes('timeout') || message.includes('exceeded')) {
    return TestErrorType.TIMEOUT;
  }
  
  if (message.includes('not found') || message.includes('no element')) {
    return TestErrorType.ELEMENT_NOT_FOUND;
  }
  
  if (message.includes('network') || message.includes('net::')) {
    return TestErrorType.NETWORK_ERROR;
  }
  
  if (message.includes('expect') || message.includes('assertion')) {
    return TestErrorType.ASSERTION_FAILED;
  }
  
  if (message.includes('clipboard')) {
    return TestErrorType.CLIPBOARD_ERROR;
  }
  
  return TestErrorType.UNKNOWN;
}

/**
 * Создание структурированной ошибки теста
 */
export function createTestError(
  error: Error,
  additionalInfo?: Record<string, unknown>
): TestError {
  return {
    type: classifyError(error),
    message: error.message,
    timestamp: new Date().toISOString(),
    additionalInfo,
  };
}

/**
 * Сбор диагностической информации о странице при ошибке
 */
export async function collectDiagnostics(page: Page): Promise<Record<string, unknown>> {
  const log = logger.child('collectDiagnostics');
  const diagnostics: Record<string, unknown> = {};
  
  try {
    // URL страницы
    diagnostics.url = page.url();
    
    // Размер viewport
    diagnostics.viewport = page.viewportSize();
    
    // Консольные ошибки (если есть)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    diagnostics.consoleErrors = consoleErrors;
    
    // Проверка наличия ошибок на странице
    const pageErrorElements = await page
      .locator('.error, [role="alert"], .alert-danger')
      .count();
    diagnostics.pageErrorElementsCount = pageErrorElements;
    
    // Заголовок страницы
    diagnostics.pageTitle = await page.title();
    
  } catch (diagError) {
    log.warn('Не удалось собрать полную диагностику', diagError);
  }
  
  return diagnostics;
}

/**
 * Обработчик ошибок для использования в хуках тестов
 */
export async function handleTestError(
  error: Error,
  page: Page,
  testInfo: TestInfo
): Promise<void> {
  const log = logger.child('handleTestError');
  
  // Классифицируем ошибку
  const testError = createTestError(error);
  log.error(`Тест "${testInfo.title}" завершился с ошибкой`, testError);
  
  // Собираем диагностику
  const diagnostics = await collectDiagnostics(page);
  
  // Сохраняем скриншот с информативным именем
  const screenshotName = `error-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
  
  try {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('Скриншот ошибки', {
      body: screenshot,
      contentType: 'image/png',
    });
  } catch (screenshotError) {
    log.warn('Не удалось сделать скриншот при ошибке', screenshotError);
  }
  
  // Прикрепляем диагностику к отчету
  await testInfo.attach('Диагностика', {
    body: JSON.stringify({ error: testError, diagnostics }, null, 2),
    contentType: 'application/json',
  });
}

/**
 * Декоратор для оборачивания тестовых шагов в try-catch с логированием
 */
export function withErrorHandling<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  stepName: string
): T {
  const log = logger.child('withErrorHandling');
  
  return (async (...args: Parameters<T>) => {
    try {
      log.debug(`Начало: ${stepName}`);
      const result = await fn(...args);
      log.debug(`Завершено: ${stepName}`);
      return result;
    } catch (error) {
      log.error(`Ошибка в "${stepName}"`, error);
      throw error;
    }
  }) as T;
}
