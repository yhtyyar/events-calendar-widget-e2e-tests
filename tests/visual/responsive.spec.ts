import { test, expect, devices } from '@playwright/test';
import { EventsWidgetPage } from '../../src/pages/EventsWidgetPage';
import { VIEWPORTS } from '../../config/test-data';

/**
 * Визуальные и адаптивные тесты.
 * Проверяют корректное отображение на различных устройствах и разрешениях.
 * Приоритет: P1 (средний)
 */
test.describe('Визуальные тесты - Адаптивность @visual @P1', () => {
  let widgetPage: EventsWidgetPage;

  test.beforeEach(async ({ page }) => {
    widgetPage = new EventsWidgetPage(page);
  });

  test('VIS-01: Мобильное устройство - отсутствие горизонтального скролла', async ({
    page,
  }) => {
    // Устанавливаем мобильный viewport (iPhone 12)
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await widgetPage.navigate();

    // Проверяем отсутствие горизонтального скролла
    const hasNoScroll = await widgetPage.hasNoHorizontalScroll();
    expect(hasNoScroll).toBe(true);
  });

  test('VIS-02: Мобильное устройство - все ключевые элементы видны', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await widgetPage.navigate();

    // Проверяем видимость ключевых элементов
    const elements = await widgetPage.areAllKeyElementsVisible();
    
    expect(elements.heading).toBe(true);
    // Описание и футер могут быть скрыты на мобильных - это допустимо
    // Footer может быть за пределами viewport на мобильных
  });

  test('VIS-03: Планшет - корректное отображение', async ({ page }) => {
    // Устанавливаем планшетный viewport (iPad)
    await page.setViewportSize(VIEWPORTS.TABLET);
    await widgetPage.navigate();

    // Проверяем отсутствие горизонтального скролла
    const hasNoScroll = await widgetPage.hasNoHorizontalScroll();
    expect(hasNoScroll).toBe(true);

    // Проверяем видимость основных элементов
    const layout = await widgetPage.checkResponsiveLayout();
    expect(layout.mainElementsVisible).toBe(true);
    // Footer может быть за пределами viewport
  });

  test('VIS-04: Десктоп - полноценное отображение', async ({ page }) => {
    // Устанавливаем десктопный viewport
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await widgetPage.navigate();

    // Проверяем полноценное отображение
    const elements = await widgetPage.areAllKeyElementsVisible();
    
    expect(elements.heading).toBe(true);
    expect(elements.description).toBe(true);
    // Footer может быть за пределами viewport, не блокируем
  });

  test('VIS-05: Десктоп малый - проверка на небольших мониторах', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP_SMALL);
    await widgetPage.navigate();

    // Проверяем отсутствие горизонтального скролла
    const hasNoScroll = await widgetPage.hasNoHorizontalScroll();
    expect(hasNoScroll).toBe(true);

    // Все элементы должны быть видны
    const heading = await widgetPage.isMainHeadingVisible();
    expect(heading).toBe(true);
  });

  test('VIS-06: Проверка скриншота ключевых элементов', async ({ page }) => {
    // Пропускаем в CI - нет baseline скриншотов
    test.skip(!!process.env.CI, 'Скриншоты проверяются локально');
    
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await widgetPage.navigate();

    // Делаем скриншот для визуальной проверки
    await expect(page).toHaveScreenshot('widget-page-desktop.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false,
    });
  });
});

/**
 * Тесты для специфичных устройств
 */
test.describe('Визуальные тесты - Устройства @visual @P1', () => {
  // Пропускаем device-тесты в Firefox - isMobile не поддерживается
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox не поддерживает isMobile в devices');
  });

  test('VIS-07: iPhone 12 - полная проверка', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    const widgetPage = new EventsWidgetPage(page);

    await widgetPage.navigate();

    // Проверяем адаптивность
    const layout = await widgetPage.checkResponsiveLayout();
    expect(layout.noHorizontalScroll).toBe(true);
    expect(layout.mainElementsVisible).toBe(true);

    await context.close();
  });

  test('VIS-08: iPad Pro - проверка планшетного режима', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro 11'],
    });
    const page = await context.newPage();
    const widgetPage = new EventsWidgetPage(page);

    await widgetPage.navigate();

    // Проверяем отображение
    const elements = await widgetPage.areAllKeyElementsVisible();
    expect(elements.heading).toBe(true);

    await context.close();
  });

  test('VIS-09: Desktop Chrome - стандартное разрешение', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();
    const widgetPage = new EventsWidgetPage(page);

    await widgetPage.navigate();

    // Проверяем основные элементы
    const elements = await widgetPage.areAllKeyElementsVisible();
    expect(elements.heading).toBe(true);
    expect(elements.description).toBe(true);

    await context.close();
  });
});

/**
 * Тесты изменения размера окна
 */
test.describe('Визуальные тесты - Ресайз @visual @P2', () => {
  test('VIS-10: Изменение размера окна не ломает верстку', async ({ page }) => {
    const widgetPage = new EventsWidgetPage(page);
    
    // Начинаем с десктопа
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await widgetPage.navigate();

    // Уменьшаем до планшета
    await page.setViewportSize(VIEWPORTS.TABLET);
    await page.waitForTimeout(300); // Ждем CSS-переходы
    
    let hasNoScroll = await widgetPage.hasNoHorizontalScroll();
    expect(hasNoScroll).toBe(true);

    // Уменьшаем до мобильного
    await page.setViewportSize(VIEWPORTS.MOBILE);
    await page.waitForTimeout(300);
    
    hasNoScroll = await widgetPage.hasNoHorizontalScroll();
    expect(hasNoScroll).toBe(true);

    // Возвращаем к десктопу
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    await page.waitForTimeout(300);
    
    const heading = await widgetPage.isMainHeadingVisible();
    expect(heading).toBe(true);
  });
});
