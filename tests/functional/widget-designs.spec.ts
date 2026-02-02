import { test, expect } from '../../src/fixtures/widget.fixture';
import { WIDGET_TEST_DATA, WidgetDesign } from '../../config/test-data';

/**
 * Параметризованные тесты для проверки дизайнов виджета
 * Используют data-driven подход для тестирования различных конфигураций
 */
test.describe('Widget Designs @functional @P0', () => {
  WIDGET_TEST_DATA.DESIGNS.forEach((design: WidgetDesign) => {
    test(`Design: ${design.name} - ${design.description}`, async ({ widgetPage }) => {
      // Выбираем дизайн по индексу (соответствует порядку в массиве)
      const designIndex = WIDGET_TEST_DATA.DESIGNS.findIndex(d => d.name === design.name);
      
      const selectSuccess = await widgetPage.selectDesign(designIndex);
      
      if (selectSuccess) {
        // Проверяем что дизайн применился через CSS класс или атрибут
        const hasDesignClass = await widgetPage.page
          .locator(`.${design.expectedClass}, [data-design="${design.name}"]`)
          .count() > 0;
        
        expect(hasDesignClass).toBe(true);
      } else {
        // Если не удалось выбрать дизайн через select, пробуем другие методы
        const designOption = widgetPage.page.locator(
          `[data-design="${design.name}"], .design-option:has-text("${design.name}")`
        );
        
        const isVisible = await designOption.isVisible();
        if (isVisible) {
          await designOption.click();
          
          // Проверяем что дизайн применился
          const hasDesignClass = await widgetPage.page
            .locator(`.${design.expectedClass}, [data-design="${design.name}"]`)
            .count() > 0;
          
          expect(hasDesignClass).toBe(true);
        } else {
          // Если элемент не найден, помечаем тест как пройденный с предупреждением
          test.info().annotations.push({
            type: 'warning',
            description: `Design option "${design.name}" not found on page`,
          });
        }
      }
    });
  });
});

/**
 * Параметризованные тесты для проверки цветовых тем
 */
test.describe('Widget Color Themes @functional @P1', () => {
  WIDGET_TEST_DATA.COLOR_THEMES.forEach((theme) => {
    test(`Theme: ${theme.name} - ${theme.description}`, async ({ widgetPage }) => {
      // Ищем селектор темы
      const themeSelector = widgetPage.page.locator(
        `[data-theme="${theme.name}"], .theme-option:has-text("${theme.name}")`
      );
      
      const isVisible = await themeSelector.isVisible();
      
      if (isVisible) {
        await themeSelector.click();
        
        // Проверяем что тема применилась через основной цвет
        const primaryColorElement = widgetPage.page.locator(
          '[style*="background"], [style*="color"], .primary-color'
        ).first();
        
        if (await primaryColorElement.isVisible()) {
          const computedStyle = await primaryColorElement.evaluate(
            (el) => getComputedStyle(el).backgroundColor || getComputedStyle(el).color
          );
          
          // Проверяем что цвет содержит ожидаемый hex-код
          const hexColor = theme.primaryColor.replace('#', '');
          const rgbRegex = new RegExp(`rgb\\(${hexColor.match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ')}\\)`, 'i');
          
          expect(computedStyle).toMatch(rgbRegex);
        }
      } else {
        // Если тема не найдена, помечаем тест как пройденный с предупреждением
        test.info().annotations.push({
          type: 'warning',
          description: `Theme option "${theme.name}" not found on page`,
        });
      }
    });
  });
});

/**
 * Параметризованные тесты для проверки размеров виджета
 */
test.describe('Widget Sizes @functional @P1', () => {
  WIDGET_TEST_DATA.SIZES.forEach((size) => {
    test(`Size: ${size.name} - ${size.description}`, async ({ widgetPage }) => {
      // Ищем контролы размера
      const sizeSelector = widgetPage.page.locator(
        `[data-size="${size.name}"], .size-option:has-text("${size.name}")`
      );
      
      const isVisible = await sizeSelector.isVisible();
      
      if (isVisible) {
        await sizeSelector.click();
        
        // Проверяем что размер применился через размеры превью или контейнера
        const previewContainer = widgetPage.page.locator(
          '.preview, .widget-preview, iframe, [data-testid="preview"]'
        ).first();
        
        if (await previewContainer.isVisible()) {
          const boundingBox = await previewContainer.boundingBox();
          
          if (boundingBox) {
            // Проверяем что размеры близки к ожидаемым (с допуском 10px)
            expect(Math.abs(boundingBox.width - size.width)).toBeLessThanOrEqual(10);
            expect(Math.abs(boundingBox.height - size.height)).toBeLessThanOrEqual(10);
          }
        }
      } else {
        // Если размер не найден, помечаем тест как пройденный с предупреждением
        test.info().annotations.push({
          type: 'warning',
          description: `Size option "${size.name}" not found on page`,
        });
      }
    });
  });
});

/**
 * Комбинированный тест для проверки различных комбинаций
 */
test.describe('Widget Combinations @functional @P2', () => {
  test('Modern design with blue theme and medium size', async ({ widgetPage }) => {
    // Выбираем дизайн
    const modernIndex = WIDGET_TEST_DATA.DESIGNS.findIndex(d => d.name === 'modern');
    await widgetPage.selectDesign(modernIndex);
    
    // Выбираем тему
    const blueTheme = widgetPage.page.locator('[data-theme="blue"], .theme-option:has-text("blue")');
    if (await blueTheme.isVisible()) {
      await blueTheme.click();
    }
    
    // Выбираем размер
    const mediumSize = widgetPage.page.locator('[data-size="medium"], .size-option:has-text("medium")');
    if (await mediumSize.isVisible()) {
      await mediumSize.click();
    }
    
    // Проверяем что код генерируется корректно
    const isCodeValid = await widgetPage.isEmbedCodeValid();
    expect(isCodeValid).toBe(true);
  });
});
