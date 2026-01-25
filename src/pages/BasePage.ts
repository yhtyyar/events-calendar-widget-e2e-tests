import { Page, Locator, expect } from '@playwright/test';
import { waitForPageReady, hasHorizontalScroll, getViewportSize } from '../utils/helpers';
import { logger } from '../utils/logger';
import { TIMEOUTS } from '../../config/test-data';

/**
 * Базовый класс для всех Page Objects.
 * Содержит общие методы и свойства, используемые на всех страницах.
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly log = logger.child(this.constructor.name);

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Абстрактный метод для получения URL страницы.
   * Должен быть реализован в наследниках.
   */
  abstract getPath(): string;

  /**
   * Переход на страницу с ожиданием загрузки
   */
  async navigate(): Promise<void> {
    this.log.step(`Переход на страницу: ${this.getPath()}`);
    
    const response = await this.page.goto(this.getPath(), {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.PAGE_LOAD,
    });

    // Проверяем успешность загрузки
    if (response) {
      const status = response.status();
      if (status >= 400) {
        throw new Error(`Страница вернула ошибку HTTP ${status}`);
      }
    }

    await waitForPageReady(this.page);
    this.log.success('Страница загружена');
  }

  /**
   * Получение HTTP статуса при загрузке страницы
   */
  async getHttpStatus(): Promise<number> {
    const response = await this.page.goto(this.getPath(), {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.PAGE_LOAD,
    });
    
    return response?.status() ?? 0;
  }

  /**
   * Получение заголовка страницы
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Получение текущего URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Проверка видимости элемента
   */
  async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Проверка отсутствия горизонтального скролла (для адаптивности)
   */
  async hasNoHorizontalScroll(): Promise<boolean> {
    const hasScroll = await hasHorizontalScroll(this.page);
    return !hasScroll;
  }

  /**
   * Получение размеров viewport
   */
  async getViewport(): Promise<{ width: number; height: number }> {
    return getViewportSize(this.page);
  }

  /**
   * Ожидание появления элемента
   */
  async waitForElement(locator: Locator, timeout = TIMEOUTS.DEFAULT): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Безопасный клик с ожиданием готовности элемента
   */
  async safeClick(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
    await locator.click();
  }

  /**
   * Получение текста элемента
   */
  async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
    return (await locator.textContent()) ?? '';
  }

  /**
   * Проверка, что страница не содержит ошибок JavaScript
   */
  async hasNoConsoleErrors(): Promise<boolean> {
    const errors: string[] = [];
    
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Даём время на сбор ошибок
    await this.page.waitForTimeout(500);
    
    return errors.length === 0;
  }

  /**
   * Создание скриншота страницы
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({
      path: `reports/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Проверка доступности элементов (базовая a11y проверка)
   */
  async checkBasicAccessibility(): Promise<{
    hasAltTexts: boolean;
    hasLangAttribute: boolean;
    hasMainLandmark: boolean;
  }> {
    // Проверка alt-текстов для изображений
    const imagesWithoutAlt = await this.page
      .locator('img:not([alt])')
      .count();

    // Проверка атрибута lang на html
    const hasLang = await this.page
      .locator('html[lang]')
      .count() > 0;

    // Проверка наличия main landmark
    const hasMain = await this.page
      .locator('main, [role="main"]')
      .count() > 0;

    return {
      hasAltTexts: imagesWithoutAlt === 0,
      hasLangAttribute: hasLang,
      hasMainLandmark: hasMain,
    };
  }
}
