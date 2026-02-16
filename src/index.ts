/**
 * Barrel export для всего src/.
 * Централизованный экспорт всех модулей проекта.
 *
 * @example
 * import { BasePage, EventsWidgetPage, test, expect, helpers, logger } from '@src';
 */

// Page Objects
export { BasePage, EventsWidgetPage } from './pages';

// Fixtures
export { test, expect, mobileTest, tabletTest, createIsolatedContext } from './fixtures';

// Utils
export {
  helpers,
  selectors,
  errorHandler,
  logger,
  Logger,
  LogLevel,
  SELECTORS,
  getSelector,
  TestErrorType,
  classifyError,
  createTestError,
  collectDiagnostics,
  handleTestError,
  withErrorHandling,
  TestError,
  waitForPageReady,
  safeGetText,
  hasHorizontalScroll,
  getViewportSize,
  copyToClipboard,
  readFromClipboard,
  measureExecutionTime,
  withRetry,
  generateTestId,
} from './utils';
