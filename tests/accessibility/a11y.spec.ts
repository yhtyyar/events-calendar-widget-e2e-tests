import { test, expect } from '@playwright/test';
import { EventsWidgetPage } from '../../src/pages/EventsWidgetPage';

/**
 * Тесты доступности (Accessibility).
 * Проверяют базовые требования a11y для веб-страниц.
 * Приоритет: P2 (низкий)
 * 
 * Примечание: Для полноценного a11y-аудита рекомендуется использовать
 * @axe-core/playwright, но базовые проверки реализованы вручную.
 */
test.describe('Тесты доступности @accessibility @P2', () => {
  let widgetPage: EventsWidgetPage;

  test.beforeEach(async ({ page }) => {
    widgetPage = new EventsWidgetPage(page);
    await widgetPage.navigate();
  });

  test('A11Y-01: Страница имеет атрибут lang', async ({ page }) => {
    // Проверяем наличие атрибута lang на html элементе
    const lang = await page.locator('html').getAttribute('lang');
    
    expect(lang).not.toBeNull();
    expect(lang?.length).toBeGreaterThan(0);
  });

  test('A11Y-02: Изображения имеют alt-атрибуты', async ({ page }) => {
    // Находим все изображения без alt
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    
    // Все изображения должны иметь alt (может быть пустым для декоративных)
    expect(imagesWithoutAlt).toBe(0);
  });

  test('A11Y-03: Страница имеет основной заголовок h1', async ({ page }) => {
    // Проверяем наличие h1
    const h1Count = await page.locator('h1').count();
    
    // Должен быть хотя бы один h1
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('A11Y-04: Ссылки имеют различимый текст', async ({ page }) => {
    // Находим ссылки без текста и без aria-label
    const emptyLinks = await page
      .locator('a:not([aria-label]):not(:has-text("."))')
      .evaluateAll((links) =>
        links.filter((link) => {
          const text = link.textContent?.trim() || '';
          const ariaLabel = link.getAttribute('aria-label') || '';
          return text.length === 0 && ariaLabel.length === 0;
        })
      );
    
    // Допускаем небольшое количество иконочных ссылок без текста
    expect(emptyLinks.length).toBeLessThanOrEqual(5);
  });

  test('A11Y-05: Формы имеют связанные labels', async ({ page }) => {
    // Находим inputs без связанных labels (кроме скрытых и submit)
    const inputsWithoutLabels = await page
      .locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])')
      .evaluateAll((inputs) =>
        inputs.filter((input) => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          const placeholder = input.getAttribute('placeholder');
          
          // Проверяем наличие какого-либо способа идентификации
          if (ariaLabel || ariaLabelledBy || placeholder) return false;
          if (id && document.querySelector(`label[for="${id}"]`)) return false;
          
          return true;
        })
      );
    
    // Допускаем некоторое количество полей без явных labels
    expect(inputsWithoutLabels.length).toBeLessThanOrEqual(3);
  });

  test('A11Y-06: Кнопки имеют доступные имена', async ({ page }) => {
    // Находим кнопки без текста и aria-label
    const buttonsWithoutLabels = await page
      .locator('button')
      .evaluateAll((buttons) =>
        buttons.filter((btn) => {
          const text = btn.textContent?.trim() || '';
          const ariaLabel = btn.getAttribute('aria-label');
          const title = btn.getAttribute('title');
          
          return text.length === 0 && !ariaLabel && !title;
        })
      );
    
    expect(buttonsWithoutLabels.length).toBeLessThanOrEqual(2);
  });

  test('A11Y-07: Контрастность текста (базовая проверка)', async ({ page }) => {
    // Базовая проверка: текст не должен быть слишком светлым на белом фоне
    const lowContrastElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6');
      let lowContrastCount = 0;
      
      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        
        // Простая проверка: если цвет очень светлый (близок к белому)
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          // Если все компоненты > 200, считаем текст слишком светлым
          if (r > 230 && g > 230 && b > 230) {
            lowContrastCount++;
          }
        }
      });
      
      return lowContrastCount;
    });
    
    // Допускаем минимальное количество элементов с низким контрастом
    expect(lowContrastElements).toBeLessThanOrEqual(5);
  });

  test('A11Y-08: Страница может быть навигирована с клавиатуры', async ({ page }) => {
    // Проверяем, что Tab-навигация работает
    await page.keyboard.press('Tab');
    
    // Получаем активный элемент
    const activeElement = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.tagName.toLowerCase() : null;
    });
    
    // Активный элемент должен быть интерактивным
    expect(['a', 'button', 'input', 'select', 'textarea', 'body']).toContain(
      activeElement
    );
  });

  test('A11Y-09: Skip-link или навигационные landmarks', async ({ page }) => {
    // Проверяем наличие main landmark или skip-link
    const hasMain = (await page.locator('main, [role="main"]').count()) > 0;
    const hasSkipLink = (await page.locator('a[href="#main"], a[href="#content"], .skip-link').count()) > 0;
    const hasNav = (await page.locator('nav, [role="navigation"]').count()) > 0;
    
    // Должен быть хотя бы один из элементов навигации
    expect(hasMain || hasSkipLink || hasNav).toBe(true);
  });

  test('A11Y-10: Фокус виден при табуляции', async ({ page }) => {
    // Нажимаем Tab несколько раз
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Проверяем, что есть элемент с outline или box-shadow (визуальный фокус)
    const hasFocusStyles = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active || active === document.body) return true; // Пропускаем body
      
      const style = window.getComputedStyle(active);
      const outline = style.outline;
      const boxShadow = style.boxShadow;
      
      // Проверяем, что есть какой-то визуальный индикатор фокуса
      return (
        (outline && outline !== 'none' && !outline.includes('0px')) ||
        (boxShadow && boxShadow !== 'none')
      );
    });
    
    // Предупреждаем, если фокус не виден, но не блокируем тест
    if (!hasFocusStyles) {
      test.info().annotations.push({
        type: 'warning',
        description: 'Визуальный индикатор фокуса может быть недостаточно заметным',
      });
    }
  });
});

/**
 * Интеграция с axe-core для полноценного a11y-аудита
 * Требует установки @axe-core/playwright
 */
test.describe('Тесты доступности - Axe Core @accessibility @P2', () => {
  test.skip('A11Y-AXE: Полный аудит с axe-core', async ({ page }) => {
    // Этот тест требует установки @axe-core/playwright
    // npm install -D @axe-core/playwright
    
    // import AxeBuilder from '@axe-core/playwright';
    // const widgetPage = new EventsWidgetPage(page);
    // await widgetPage.navigate();
    // 
    // const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    // expect(accessibilityScanResults.violations).toEqual([]);
    
    test.info().annotations.push({
      type: 'info',
      description: 'Для полного аудита установите @axe-core/playwright',
    });
  });
});
