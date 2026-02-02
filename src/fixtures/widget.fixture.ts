import { test as base, Page } from '@playwright/test';
import { EventsWidgetPage } from '../pages/EventsWidgetPage';

/**
 * Интерфейс для расширения базовых фикстур Playwright
 */
export interface WidgetFixtures {
  widgetPage: EventsWidgetPage;
  authenticatedWidgetPage: EventsWidgetPage;
  widgetPageWithDesign: EventsWidgetPage;
}

/**
 * Расширение базовых фикстур Playwright для виджета
 * Позволяет переиспользовать общий setup код в тестах
 */
export const test = base.extend<WidgetFixtures>({
  /**
   * Фикстура для страницы виджета с базовой навигацией
   * Автоматически переходит на страницу и ждет загрузки
   */
  widgetPage: async ({ page }, use) => {
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
    await use(widgetPage);
  },

  /**
   * Фикстура для аутентифицированной страницы виджета
   * В будущем можно добавить логику авторизации
   */
  authenticatedWidgetPage: async ({ page }, use) => {
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
    
    // TODO: Добавить логику авторизации когда будет готова
    // await widgetPage.login();
    
    await use(widgetPage);
  },

  /**
   * Фикстура для страницы виджета с выбранным дизайном
   * Полезна для тестов которые требуют предустановленного состояния
   */
  widgetPageWithDesign: async ({ page }, use) => {
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
    
    // Выбираем дизайн по умолчанию для тестов
    try {
      await widgetPage.selectDesign(0); // Используем индекс вместо строки
    } catch (error) {
      // Если не удалось выбрать дизайн, продолжаем с состоянием по умолчанию
      console.warn('Failed to select default design:', error);
    }
    
    await use(widgetPage);
  },
});

/**
 * Re-export expect из Playwright для удобства импорта
 */
export { expect } from '@playwright/test';

/**
 * Re-export Page из Playwright для удобства импорта
 */
export { Page } from '@playwright/test';
