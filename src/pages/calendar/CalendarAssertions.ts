import { Page, expect } from '@playwright/test';
import { CalendarPage } from './CalendarPage';
import { EventData } from './CalendarActions';
import { step, attachText, logStep } from '../../utils/allureHelper';
import { TIMEOUTS } from '../../../config/test-data';

/**
 * CalendarAssertions - проверки для календаря.
 * Содержит все assert-методы для валидации состояния календаря и событий.
 */
export class CalendarAssertions {
  private readonly page: Page;
  private readonly calendarPage: CalendarPage;

  constructor(page: Page) {
    this.page = page;
    this.calendarPage = new CalendarPage(page);
  }

  // ============ ПРОВЕРКИ ВИДИМОСТИ ============

  /**
   * Проверяет что календарь отображается
   */
  async assertCalendarVisible(): Promise<void> {
    await step('Проверка видимости календаря', async () => {
      await expect(this.calendarPage.calendarContainer).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      logStep('Календарь отображается');
    });
  }

  /**
   * Проверяет что форма события отображается
   */
  async assertEventFormVisible(): Promise<void> {
    await step('Проверка видимости формы события', async () => {
      await expect(this.calendarPage.eventForm).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      logStep('Форма события отображается');
    });
  }

  /**
   * Проверяет что форма события скрыта
   */
  async assertEventFormHidden(): Promise<void> {
    await step('Проверка скрытия формы события', async () => {
      await expect(this.calendarPage.eventForm).toBeHidden({ timeout: TIMEOUTS.DEFAULT });
      logStep('Форма события скрыта');
    });
  }

  // ============ ПРОВЕРКИ СОБЫТИЙ ============

  /**
   * Проверяет что событие создано и отображается
   */
  async assertEventCreated(title: string): Promise<void> {
    await step(`Проверка создания события: ${title}`, async () => {
      const eventLocator = this.calendarPage.getEventByTitle(title);
      await expect(eventLocator.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      logStep(`Событие "${title}" успешно создано`);
    });
  }

  /**
   * Проверяет что событие удалено (не отображается)
   */
  async assertEventDeleted(title: string): Promise<void> {
    await step(`Проверка удаления события: ${title}`, async () => {
      const eventLocator = this.calendarPage.getEventByTitle(title);
      await expect(eventLocator).toHaveCount(0, { timeout: TIMEOUTS.DEFAULT });
      logStep(`Событие "${title}" удалено`);
    });
  }

  /**
   * Проверяет что событие существует по ID
   */
  async assertEventExistsById(eventId: string | number): Promise<void> {
    await step(`Проверка существования события ${eventId}`, async () => {
      const eventLocator = this.calendarPage.getEventById(eventId);
      await expect(eventLocator).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      logStep(`Событие ${eventId} существует`);
    });
  }

  /**
   * Проверяет количество событий
   */
  async assertEventsCount(expectedCount: number): Promise<void> {
    await step(`Проверка количества событий: ${expectedCount}`, async () => {
      await expect(this.calendarPage.eventItems).toHaveCount(expectedCount, { timeout: TIMEOUTS.DEFAULT });
      logStep(`Количество событий: ${expectedCount}`);
    });
  }

  /**
   * Проверяет что количество событий больше указанного
   */
  async assertEventsCountGreaterThan(minCount: number): Promise<void> {
    await step(`Проверка что событий больше ${minCount}`, async () => {
      const count = await this.calendarPage.getEventsCount();
      expect(count).toBeGreaterThan(minCount);
      logStep(`Количество событий (${count}) > ${minCount}`);
    });
  }

  // ============ ПРОВЕРКИ ДАННЫХ СОБЫТИЯ ============

  /**
   * Проверяет данные события
   */
  async assertEventData(title: string, expectedData: Partial<EventData>): Promise<void> {
    await step(`Проверка данных события: ${title}`, async () => {
      const eventLocator = this.calendarPage.getEventByTitle(title).first();
      await expect(eventLocator).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      
      // Проверяем заголовок
      if (expectedData.title) {
        await expect(eventLocator).toContainText(expectedData.title);
      }
      
      // Проверяем даты через data-атрибуты или текст
      if (expectedData.startDate) {
        const hasDate = await eventLocator.locator(`[data-date="${expectedData.startDate}"]`).count() > 0 ||
                       (await eventLocator.textContent())?.includes(expectedData.startDate);
        expect(hasDate).toBeTruthy();
      }
      
      logStep('Данные события соответствуют ожидаемым');
    });
  }

  // ============ ПРОВЕРКИ НАВИГАЦИИ ============

  /**
   * Проверяет текущий отображаемый месяц
   */
  async assertCurrentMonth(expectedMonth: string): Promise<void> {
    await step(`Проверка текущего месяца: ${expectedMonth}`, async () => {
      const currentMonth = await this.calendarPage.getCurrentMonth();
      expect(currentMonth.toLowerCase()).toContain(expectedMonth.toLowerCase());
      logStep(`Текущий месяц: ${expectedMonth}`);
    });
  }

  /**
   * Проверяет текущий отображаемый год
   */
  async assertCurrentYear(expectedYear: string): Promise<void> {
    await step(`Проверка текущего года: ${expectedYear}`, async () => {
      const currentYear = await this.calendarPage.getCurrentYear();
      expect(currentYear).toContain(expectedYear);
      logStep(`Текущий год: ${expectedYear}`);
    });
  }

  // ============ ПРОВЕРКИ СИНХРОНИЗАЦИИ ============

  /**
   * Проверяет что синхронизация в процессе
   */
  async assertSyncInProgress(): Promise<void> {
    await step('Проверка что синхронизация в процессе', async () => {
      await expect(this.calendarPage.syncIndicator).toBeVisible({ timeout: TIMEOUTS.SHORT });
      logStep('Синхронизация в процессе');
    });
  }

  /**
   * Проверяет что синхронизация завершена
   */
  async assertSyncCompleted(): Promise<void> {
    await step('Проверка завершения синхронизации', async () => {
      await expect(this.calendarPage.syncIndicator).toBeHidden({ timeout: TIMEOUTS.NETWORK });
      logStep('Синхронизация завершена');
    });
  }

  /**
   * Проверяет статус синхронизации
   */
  async assertSyncStatus(expectedStatus: string): Promise<void> {
    await step(`Проверка статуса синхронизации: ${expectedStatus}`, async () => {
      await expect(this.calendarPage.syncStatus).toContainText(expectedStatus, { timeout: TIMEOUTS.DEFAULT });
      logStep(`Статус синхронизации: ${expectedStatus}`);
    });
  }

  // ============ ПРОВЕРКИ ФОРМЫ ============

  /**
   * Проверяет что поле заголовка содержит ошибку валидации
   */
  async assertTitleValidationError(): Promise<void> {
    await step('Проверка ошибки валидации заголовка', async () => {
      // Проверяем наличие класса ошибки или aria-invalid
      const titleInput = this.calendarPage.eventTitleInput;
      const hasError = await titleInput.evaluate((el) => {
        return el.classList.contains('error') || 
               el.classList.contains('invalid') ||
               el.getAttribute('aria-invalid') === 'true';
      }).catch(() => false);
      
      if (!hasError) {
        // Fallback: проверяем наличие сообщения об ошибке рядом
        const errorMsg = this.page.locator('.error-message, [role="alert"]').first();
        await expect(errorMsg).toBeVisible();
      }
      
      logStep('Ошибка валидации заголовка отображается');
    });
  }

  /**
   * Проверяет значение поля заголовка
   */
  async assertTitleValue(expectedValue: string): Promise<void> {
    await step(`Проверка значения заголовка: ${expectedValue}`, async () => {
      await expect(this.calendarPage.eventTitleInput).toHaveValue(expectedValue);
      logStep(`Заголовок: ${expectedValue}`);
    });
  }

  // ============ ПРОВЕРКИ ДАТ ============

  /**
   * Проверяет что день доступен для клика
   */
  async assertDayClickable(date: string): Promise<void> {
    await step(`Проверка что день ${date} кликабельный`, async () => {
      const dayLocator = this.calendarPage.getDayByDate(date);
      await expect(dayLocator).toBeEnabled();
      await expect(dayLocator).toBeVisible();
      logStep(`День ${date} доступен для клика`);
    });
  }

  /**
   * Проверяет что день отключен (прошлая дата)
   */
  async assertDayDisabled(date: string): Promise<void> {
    await step(`Проверка что день ${date} отключен`, async () => {
      const dayLocator = this.calendarPage.getDayByDate(date);
      const isDisabled = await dayLocator.evaluate((el) => {
        return el.classList.contains('disabled') ||
               el.classList.contains('past') ||
               el.hasAttribute('disabled') ||
               el.getAttribute('aria-disabled') === 'true';
      }).catch(() => false);
      
      expect(isDisabled).toBeTruthy();
      logStep(`День ${date} отключен`);
    });
  }

  // ============ КОМПЛЕКСНЫЕ ПРОВЕРКИ ============

  /**
   * Проверяет полное состояние календаря
   */
  async assertCalendarState(options: {
    isVisible?: boolean;
    month?: string;
    year?: string;
    eventsCount?: number;
  }): Promise<void> {
    await step('Проверка состояния календаря', async () => {
      if (options.isVisible !== undefined) {
        if (options.isVisible) {
          await this.assertCalendarVisible();
        }
      }
      
      if (options.month) {
        await this.assertCurrentMonth(options.month);
      }
      
      if (options.year) {
        await this.assertCurrentYear(options.year);
      }
      
      if (options.eventsCount !== undefined) {
        await this.assertEventsCount(options.eventsCount);
      }
      
      attachText('Calendar State', JSON.stringify(options, null, 2));
      logStep('Состояние календаря проверено');
    });
  }

  /**
   * Получает CalendarPage для прямого доступа к локаторам
   */
  getPage(): CalendarPage {
    return this.calendarPage;
  }
}
