import { test as base, Page, BrowserContext } from '@playwright/test';
import { EventsWidgetPage } from '../pages/EventsWidgetPage';

/**
 * Кастомные фикстуры для тестов виджета календаря.
 * Обеспечивают изоляцию тестов и подготовку окружения.
 */

// Расширение типов фикстур
interface EventsWidgetFixtures {
  eventsWidgetPage: EventsWidgetPage;
  authenticatedPage: EventsWidgetPage;
}

/**
 * Расширенный test с предварительно настроенными фикстурами
 */
export const test = base.extend<EventsWidgetFixtures>({
  // Фикстура для страницы виджета
  eventsWidgetPage: async ({ page }, use) => {
    const widgetPage = new EventsWidgetPage(page);
    
    // Предварительная навигация на страницу
    await widgetPage.navigate();
    
    // Передаем фикстуру в тест
    await use(widgetPage);
    
    // Очистка после теста (если необходимо)
  },

  // Фикстура для аутентифицированной страницы (заглушка для будущего расширения)
  authenticatedPage: async ({ page }, use) => {
    const widgetPage = new EventsWidgetPage(page);
    
    // Здесь может быть логика аутентификации
    // Например, установка cookies или токенов
    
    await widgetPage.navigate();
    await use(widgetPage);
  },
});

// Реэкспорт expect для удобства использования
export { expect } from '@playwright/test';

/**
 * Хелпер для создания изолированного контекста браузера
 */
export async function createIsolatedContext(
  browser: BrowserContext
): Promise<{ context: BrowserContext; page: Page }> {
  const context = browser;
  const page = await context.newPage();
  return { context, page };
}

/**
 * Фикстура для мобильного тестирования
 */
export const mobileTest = base.extend<EventsWidgetFixtures>({
  eventsWidgetPage: async ({ page }, use) => {
    // Устанавливаем мобильный viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
    await use(widgetPage);
  },
  
  authenticatedPage: async ({ page }, use) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
    await use(widgetPage);
  },
});

/**
 * Фикстура для планшетного тестирования
 */
export const tabletTest = base.extend<EventsWidgetFixtures>({
  eventsWidgetPage: async ({ page }, use) => {
    // Устанавливаем планшетный viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
    await use(widgetPage);
  },
  
  authenticatedPage: async ({ page }, use) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
    await use(widgetPage);
  },
});
