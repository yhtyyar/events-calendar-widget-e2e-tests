/**
 * Barrel export для фикстур.
 * Централизованный экспорт всех кастомных фикстур.
 *
 * @example
 * import { test, expect, mobileTest, tabletTest } from '@fixtures';
 */

export { test, expect, mobileTest, tabletTest, createIsolatedContext } from './eventsWidgetFixture';
