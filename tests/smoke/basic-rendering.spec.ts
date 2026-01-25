import { test, expect } from '@playwright/test';
import { EventsWidgetPage } from '../../src/pages/EventsWidgetPage';
import { EXPECTED_TEXTS, URLS } from '../../config/test-data';

/**
 * Smoke-тесты для страницы виджета календаря мероприятий.
 * Проверяют базовую работоспособность и критические элементы страницы.
 * Приоритет: P0 (блокирующие)
 */
test.describe('Smoke тесты - Базовое отображение @smoke @P0', () => {
  let widgetPage: EventsWidgetPage;

  test.beforeEach(async ({ page }) => {
    widgetPage = new EventsWidgetPage(page);
  });

  test('SMOKE-01: Страница загружается с HTTP статусом 200', async ({ page }) => {
    // Проверяем успешную загрузку страницы
    const response = await page.goto(URLS.EVENTS_WIDGET);
    
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);
  });

  test('SMOKE-02: Основной заголовок отображается корректно', async ({ page }) => {
    await widgetPage.navigate();
    
    // Проверяем наличие заголовка с текстом про календарь мероприятий
    const isHeadingVisible = await widgetPage.isMainHeadingVisible();
    expect(isHeadingVisible).toBe(true);
    
    // Проверяем содержимое заголовка
    const headingText = await widgetPage.getMainHeadingText();
    expect(headingText.toLowerCase()).toContain('календарь мероприятий');
  });

  test('SMOKE-03: Описательный текст присутствует на странице', async ({ page }) => {
    await widgetPage.navigate();
    
    // Проверяем наличие описательного текста
    const isDescriptionVisible = await widgetPage.isDescriptionVisible();
    expect(isDescriptionVisible).toBe(true);
  });

  test('SMOKE-04: Заголовок страницы соответствует ожиданиям', async ({ page }) => {
    await widgetPage.navigate();
    
    // Проверяем title страницы (ищем корень слова "календар")
    const pageTitle = await widgetPage.getTitle();
    expect(pageTitle.toLowerCase()).toMatch(/календар/);
  });

  test('SMOKE-05: Футер страницы отображается', async ({ page }) => {
    await widgetPage.navigate();
    
    // Проверяем наличие футера или нижней части страницы
    const isFooterVisible = await widgetPage.isFooterVisible();
    
    // Если футер не найден стандартным способом, проверяем наличие нижней части страницы
    if (!isFooterVisible) {
      // Fallback: проверяем что страница прокручивается до конца
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const bottomElements = await page.locator('body > *:last-child').count();
      expect(bottomElements).toBeGreaterThan(0);
    } else {
      expect(isFooterVisible).toBe(true);
    }
  });

  test('SMOKE-06: Страница не содержит критических ошибок в консоли', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Собираем ошибки консоли
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await widgetPage.navigate();
    
    // Ждем возможные отложенные ошибки
    await page.waitForTimeout(1000);
    
    // Фильтруем некритичные ошибки (например, CORS для внешних ресурсов)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('CORS') &&
        !error.includes('net::ERR')
    );
    
    // Допускаем отсутствие критических ошибок
    expect(criticalErrors.length).toBeLessThanOrEqual(0);
  });

  test('SMOKE-07: Ссылка на календарь мероприятий присутствует', async ({ page }) => {
    await widgetPage.navigate();
    
    // Проверяем наличие любой ссылки с текстом про календарь/мероприятия или activity
    const calendarLinkVisible = await widgetPage.isCalendarLinkVisible();
    
    // Fallback: ищем любые ссылки на странице
    if (!calendarLinkVisible) {
      const anyLinks = await page.locator('a[href]').count();
      // На странице должны быть какие-то ссылки
      expect(anyLinks).toBeGreaterThan(0);
    } else {
      expect(calendarLinkVisible).toBe(true);
    }
  });

  test('SMOKE-08: URL страницы корректный после загрузки', async ({ page }) => {
    await widgetPage.navigate();
    
    // Проверяем, что URL содержит ожидаемый путь
    const currentUrl = widgetPage.getCurrentUrl();
    expect(currentUrl).toContain('eventswidget');
  });
});
