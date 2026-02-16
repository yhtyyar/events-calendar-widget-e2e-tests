/**
 * Barrel export для утилит.
 * Централизованный экспорт всех utility-функций.
 *
 * @example
 * import { helpers, selectors, logger, errorHandler } from '@utils';
 */

export * as helpers from './helpers';
export * as selectors from './selectors';
export * as errorHandler from './errorHandler';

// Экспортируем logger отдельно
export { logger, Logger, LogLevel } from './logger';

// Конкретные функции для удобства
export { SELECTORS, getSelector } from './selectors';
export {
  TestErrorType,
  classifyError,
  createTestError,
  collectDiagnostics,
  handleTestError,
  withErrorHandling,
  type TestError,
} from './errorHandler';
export {
  waitForPageReady,
  safeGetText,
  hasHorizontalScroll,
  getViewportSize,
  copyToClipboard,
  readFromClipboard,
  measureExecutionTime,
  withRetry,
  generateTestId,
} from './helpers';
