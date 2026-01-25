import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { URLS, EXPECTED_TEXTS, TIMEOUTS, VALIDATION_PATTERNS } from '../../config/test-data';
import { SELECTORS } from '../utils/selectors';
import { copyToClipboard, readFromClipboard, withRetry } from '../utils/helpers';

/**
 * Page Object для страницы виджета календаря мероприятий.
 * Инкапсулирует все взаимодействия с элементами страницы.
 */
export class EventsWidgetPage extends BasePage {
  // Локаторы основных элементов страницы
  private readonly mainHeading: Locator;
  private readonly descriptionText: Locator;
  private readonly embedCodeField: Locator;
  private readonly copyButton: Locator;
  private readonly calendarLink: Locator;
  private readonly footer: Locator;

  constructor(page: Page) {
    super(page);
    
    // Инициализация локаторов
    // Используем несколько стратегий для повышения надежности
    this.mainHeading = this.page.locator(SELECTORS.WIDGET.HEADING);
    this.descriptionText = this.page.locator(SELECTORS.WIDGET.DESCRIPTION);
    this.embedCodeField = this.page.locator(SELECTORS.WIDGET.EMBED_CODE_FIELD);
    this.copyButton = this.page.locator(SELECTORS.WIDGET.COPY_BUTTON);
    this.calendarLink = this.page.locator(SELECTORS.NAVIGATION.EVENTS_LINK).first();
    this.footer = this.page.locator(SELECTORS.FOOTER.CONTAINER);
  }

  /**
   * Путь к странице виджета
   */
  getPath(): string {
    return URLS.EVENTS_WIDGET;
  }

  // ========== Методы проверки отображения ==========

  /**
   * Проверка видимости основного заголовка
   */
  async isMainHeadingVisible(): Promise<boolean> {
    // Пробуем несколько вариантов поиска заголовка
    const headingByText = this.page.getByText(EXPECTED_TEXTS.MAIN_HEADING, { exact: false });
    const headingByPartial = this.page.locator(SELECTORS.WIDGET.HEADING_PARTIAL);
    
    const byText = await this.isElementVisible(headingByText);
    const byPartial = await this.isElementVisible(headingByPartial);
    
    return byText || byPartial;
  }

  /**
   * Получение текста основного заголовка
   */
  async getMainHeadingText(): Promise<string> {
    // Ищем заголовок по частичному совпадению
    const heading = this.page.locator(SELECTORS.WIDGET.HEADING_PARTIAL).first();
    
    if (await this.isElementVisible(heading)) {
      return this.getText(heading);
    }
    
    // Fallback: ищем в h1
    const h1 = this.page.locator('h1').first();
    return this.getText(h1);
  }

  /**
   * Проверка видимости описательного текста
   */
  async isDescriptionVisible(): Promise<boolean> {
    const descByText = this.page.getByText(EXPECTED_TEXTS.DESCRIPTION, { exact: false });
    const descByPartial = this.page.locator(SELECTORS.WIDGET.DESCRIPTION_PARTIAL);
    
    const byText = await this.isElementVisible(descByText);
    const byPartial = await this.isElementVisible(descByPartial);
    
    return byText || byPartial;
  }

  /**
   * Получение описательного текста
   */
  async getDescriptionText(): Promise<string> {
    const desc = this.page.locator(SELECTORS.WIDGET.DESCRIPTION_PARTIAL).first();
    
    if (await this.isElementVisible(desc)) {
      return this.getText(desc);
    }
    
    return '';
  }

  /**
   * Проверка наличия ссылки на календарь мероприятий
   */
  async isCalendarLinkVisible(): Promise<boolean> {
    return this.isElementVisible(this.calendarLink);
  }

  /**
   * Проверка видимости футера
   */
  async isFooterVisible(): Promise<boolean> {
    return this.isElementVisible(this.footer);
  }

  // ========== Методы работы с кодом вставки ==========

  /**
   * Проверка наличия поля с кодом вставки
   */
  async isEmbedCodeFieldVisible(): Promise<boolean> {
    return this.isElementVisible(this.embedCodeField);
  }

  /**
   * Получение кода вставки из поля
   */
  async getEmbedCode(): Promise<string> {
    // Ищем поле с кодом - это может быть textarea, input или div
    const codeSelectors = [
      'textarea',
      'input[readonly]',
      'code',
      '.embed-code',
      '[data-code]',
    ];

    for (const selector of codeSelectors) {
      const element = this.page.locator(selector).first();
      const isVisible = await this.isElementVisible(element);
      
      if (isVisible) {
        // Для input/textarea получаем value, для остальных - textContent
        const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
        
        if (tagName === 'input' || tagName === 'textarea') {
          const value = await element.inputValue();
          if (value && value.trim()) {
            return value;
          }
        } else {
          const text = await element.textContent();
          if (text && text.trim()) {
            return text;
          }
        }
      }
    }

    this.log.warn('Поле с кодом вставки не найдено');
    return '';
  }

  /**
   * Проверка валидности кода вставки (должен содержать HTML теги)
   */
  async isEmbedCodeValid(): Promise<boolean> {
    const code = await this.getEmbedCode();
    
    if (!code) {
      return false;
    }

    // Проверяем, что код содержит HTML-теги
    return VALIDATION_PATTERNS.EMBED_CODE.test(code);
  }

  /**
   * Проверка наличия кнопки копирования
   */
  async isCopyButtonVisible(): Promise<boolean> {
    const copyButtons = [
      this.copyButton,
      this.page.getByRole('button', { name: /копир/i }),
      this.page.locator('[data-action="copy"], .copy-btn, .btn-copy'),
    ];

    for (const btn of copyButtons) {
      if (await this.isElementVisible(btn)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Клик по кнопке копирования с fallback стратегией для Firefox
   */
  async clickCopyButton(): Promise<boolean> {
    const copyButtons = [
      this.copyButton,
      this.page.getByRole('button', { name: /копир/i }),
      this.page.locator('[data-action="copy"], .copy-btn, .btn-copy'),
    ];

    for (const btn of copyButtons) {
      try {
        if (await this.isElementVisible(btn)) {
          await this.safeClick(btn);
          this.log.success('Кнопка копирования нажата');
          return true;
        }
      } catch (error) {
        this.log.warn('Не удалось кликнуть по кнопке копирования', error);
      }
    }

    return false;
  }

  // ========== Методы для работы с настройками виджета ==========

  /**
   * Получение списка доступных дизайнов/тем
   */
  async getAvailableDesigns(): Promise<string[]> {
    const designSelectors = [
      'select option',
      '.design-option',
      '[data-design]',
      '.theme-selector input',
    ];

    const designs: string[] = [];

    for (const selector of designSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const text = await elements.nth(i).textContent();
          if (text) {
            designs.push(text.trim());
          }
        }
        break;
      }
    }

    return designs;
  }

  /**
   * Выбор дизайна виджета
   */
  async selectDesign(designIndex = 0): Promise<boolean> {
    try {
      // Попытка 1: select элемент
      const select = this.page.locator(SELECTORS.WIDGET.DESIGN_SELECTOR);
      if (await this.isElementVisible(select)) {
        const options = await select.locator('option').all();
        if (options.length > designIndex) {
          await select.selectOption({ index: designIndex });
          this.log.success(`Выбран дизайн с индексом ${designIndex}`);
          return true;
        }
      }

      // Попытка 2: radio/checkbox
      const designOptions = this.page.locator('.design-option, [data-design]');
      const count = await designOptions.count();
      if (count > designIndex) {
        await designOptions.nth(designIndex).click();
        this.log.success(`Выбран дизайн с индексом ${designIndex}`);
        return true;
      }

      return false;
    } catch (error) {
      this.log.warn('Не удалось выбрать дизайн', error);
      return false;
    }
  }

  // ========== Методы проверки адаптивности ==========

  /**
   * Проверка корректного отображения на текущем viewport
   */
  async checkResponsiveLayout(): Promise<{
    noHorizontalScroll: boolean;
    mainElementsVisible: boolean;
    footerVisible: boolean;
  }> {
    const noHorizontalScroll = await this.hasNoHorizontalScroll();
    const mainElementsVisible = await this.isMainHeadingVisible();
    const footerVisible = await this.isFooterVisible();

    return {
      noHorizontalScroll,
      mainElementsVisible,
      footerVisible,
    };
  }

  /**
   * Проверка, что все ключевые элементы видны
   */
  async areAllKeyElementsVisible(): Promise<{
    heading: boolean;
    description: boolean;
    footer: boolean;
  }> {
    return {
      heading: await this.isMainHeadingVisible(),
      description: await this.isDescriptionVisible(),
      footer: await this.isFooterVisible(),
    };
  }

  // ========== Методы для работы со ссылками ==========

  /**
   * Переход по ссылке на календарь мероприятий
   */
  async goToCalendar(): Promise<void> {
    if (await this.isCalendarLinkVisible()) {
      await this.safeClick(this.calendarLink);
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  /**
   * Получение всех внешних ссылок на странице
   */
  async getExternalLinks(): Promise<string[]> {
    const links = await this.page.locator('a[href^="http"]').all();
    const hrefs: string[] = [];
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) {
        hrefs.push(href);
      }
    }
    
    return hrefs;
  }

  // ========== Методы для проверки производительности ==========

  /**
   * Замер времени загрузки страницы
   */
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.navigate();
    const endTime = Date.now();
    
    return endTime - startTime;
  }

  /**
   * Получение метрик производительности из браузера
   */
  async getPerformanceMetrics(): Promise<{
    domContentLoaded: number;
    loadComplete: number;
  }> {
    const metrics = await this.page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
      };
    });
    
    return metrics;
  }
}
