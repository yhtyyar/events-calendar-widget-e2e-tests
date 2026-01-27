import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CALENDAR_SELECTORS, WIDGET_SELECTORS, getTestIdOrFallback, FALLBACK_SELECTORS } from '../../utils/selectors';
import { URLS, TIMEOUTS } from '../../../config/test-data';
import { step } from '../../utils/allureHelper';

/**
 * CalendarPage - UI методы для работы с календарем.
 * Отвечает только за локаторы и базовое взаимодействие с элементами.
 * Бизнес-логика вынесена в CalendarActions.
 */
export class CalendarPage extends BasePage {
  // ============ ЛОКАТОРЫ ============
  
  // Контейнер календаря
  readonly calendarContainer: Locator;
  readonly calendarHeader: Locator;
  readonly calendarBody: Locator;
  
  // Навигация по датам
  readonly prevMonthButton: Locator;
  readonly nextMonthButton: Locator;
  readonly monthDisplay: Locator;
  readonly yearDisplay: Locator;
  
  // Элементы дней
  readonly dayElements: Locator;
  
  // Форма события
  readonly eventForm: Locator;
  readonly eventTitleInput: Locator;
  readonly eventDescriptionInput: Locator;
  readonly eventStartDateInput: Locator;
  readonly eventEndDateInput: Locator;
  readonly eventStartTimeInput: Locator;
  readonly eventEndTimeInput: Locator;
  readonly eventColorPicker: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  
  // Список событий
  readonly eventItems: Locator;
  
  // Синхронизация
  readonly syncButton: Locator;
  readonly syncStatus: Locator;
  readonly syncIndicator: Locator;

  constructor(page: Page) {
    super(page);
    
    // Инициализация локаторов с fallback
    this.calendarContainer = this.createLocator(CALENDAR_SELECTORS.calendarContainer, '.calendar, #calendar');
    this.calendarHeader = this.createLocator(CALENDAR_SELECTORS.calendarHeader, '.calendar-header');
    this.calendarBody = this.createLocator(CALENDAR_SELECTORS.calendarBody, '.calendar-body');
    
    this.prevMonthButton = this.createLocator(CALENDAR_SELECTORS.calendarNavPrev, '.nav-prev, [aria-label*="previous"]');
    this.nextMonthButton = this.createLocator(CALENDAR_SELECTORS.calendarNavNext, '.nav-next, [aria-label*="next"]');
    this.monthDisplay = this.createLocator(CALENDAR_SELECTORS.calendarMonth, '.current-month');
    this.yearDisplay = this.createLocator(CALENDAR_SELECTORS.calendarYear, '.current-year');
    
    this.dayElements = this.createLocator(CALENDAR_SELECTORS.calendarDay, '.calendar-day, td[data-date]');
    
    this.eventForm = this.createLocator(CALENDAR_SELECTORS.eventForm, 'form.event-form, #event-form');
    this.eventTitleInput = this.createLocator(CALENDAR_SELECTORS.eventTitleInput, 'input[name="title"], #event-title');
    this.eventDescriptionInput = this.createLocator(CALENDAR_SELECTORS.eventDescriptionInput, 'textarea[name="description"], #event-description');
    this.eventStartDateInput = this.createLocator(CALENDAR_SELECTORS.eventStartDate, 'input[name="startDate"], #start-date');
    this.eventEndDateInput = this.createLocator(CALENDAR_SELECTORS.eventEndDate, 'input[name="endDate"], #end-date');
    this.eventStartTimeInput = this.createLocator(CALENDAR_SELECTORS.eventStartTime, 'input[name="startTime"], #start-time');
    this.eventEndTimeInput = this.createLocator(CALENDAR_SELECTORS.eventEndTime, 'input[name="endTime"], #end-time');
    this.eventColorPicker = this.createLocator(CALENDAR_SELECTORS.eventColorPicker, 'input[type="color"], .color-picker');
    this.submitButton = this.createLocator(CALENDAR_SELECTORS.submitButton, 'button[type="submit"], .btn-submit');
    this.cancelButton = this.createLocator(CALENDAR_SELECTORS.cancelButton, 'button.cancel, .btn-cancel');
    this.deleteButton = this.createLocator(CALENDAR_SELECTORS.deleteButton, 'button.delete, .btn-delete');
    
    this.eventItems = this.createLocator(CALENDAR_SELECTORS.eventItem, '.event-item, .event');
    
    this.syncButton = this.createLocator(CALENDAR_SELECTORS.syncButton, 'button.sync, .btn-sync');
    this.syncStatus = this.createLocator(CALENDAR_SELECTORS.syncStatus, '.sync-status');
    this.syncIndicator = this.createLocator(CALENDAR_SELECTORS.syncIndicator, '.sync-indicator, .syncing');
  }

  // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

  /**
   * Создает локатор с fallback селектором
   */
  private createLocator(primary: string, fallback: string): Locator {
    return this.page.locator(getTestIdOrFallback(primary, fallback));
  }

  getPath(): string {
    return URLS.EVENTS_WIDGET;
  }

  // ============ МЕТОДЫ ОЖИДАНИЯ ============

  /**
   * Ожидает появления календаря
   */
  async waitForCalendarReady(timeout = TIMEOUTS.DEFAULT): Promise<void> {
    await step('Ожидание загрузки календаря', async () => {
      await this.calendarContainer.or(this.page.locator('.calendar, #calendar')).waitFor({ 
        state: 'visible', 
        timeout 
      });
    });
  }

  /**
   * Ожидает появления формы события
   */
  async waitForEventForm(timeout = TIMEOUTS.DEFAULT): Promise<void> {
    await step('Ожидание формы события', async () => {
      await this.eventForm.or(this.page.locator('form')).waitFor({ 
        state: 'visible', 
        timeout 
      });
    });
  }

  /**
   * Ожидает завершения синхронизации
   */
  async waitForSyncComplete(timeout = TIMEOUTS.NETWORK): Promise<void> {
    await step('Ожидание завершения синхронизации', async () => {
      // Ждем пока индикатор синхронизации исчезнет
      await this.syncIndicator.waitFor({ state: 'hidden', timeout }).catch(() => {
        // Индикатор может и не появиться, это нормально
      });
    });
  }

  // ============ МЕТОДЫ ПОЛУЧЕНИЯ ЭЛЕМЕНТОВ ============

  /**
   * Получает день по дате
   */
  getDayByDate(date: string | Date): Locator {
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    return this.page.locator(`[data-testid="calendar-day-${dateStr}"], [data-date="${dateStr}"], td[data-date="${dateStr}"]`);
  }

  /**
   * Получает событие по ID
   */
  getEventById(eventId: string | number): Locator {
    return this.page.locator(`[data-testid="event-item-${eventId}"], [data-event-id="${eventId}"]`);
  }

  /**
   * Получает событие по заголовку
   */
  getEventByTitle(title: string): Locator {
    return this.eventItems.filter({ hasText: title });
  }

  /**
   * Получает количество событий
   */
  async getEventsCount(): Promise<number> {
    return this.eventItems.count();
  }

  // ============ БАЗОВЫЕ UI ОПЕРАЦИИ ============

  /**
   * Кликает по дню в календаре
   */
  async clickOnDay(date: string | Date): Promise<void> {
    await step(`Клик по дню ${date}`, async () => {
      const dayLocator = this.getDayByDate(date);
      await this.waitForElement(dayLocator);
      await dayLocator.click();
    });
  }

  /**
   * Переходит к предыдущему месяцу
   */
  async goToPreviousMonth(): Promise<void> {
    await step('Переход к предыдущему месяцу', async () => {
      await this.safeClick(this.prevMonthButton);
    });
  }

  /**
   * Переходит к следующему месяцу
   */
  async goToNextMonth(): Promise<void> {
    await step('Переход к следующему месяцу', async () => {
      await this.safeClick(this.nextMonthButton);
    });
  }

  /**
   * Получает текущий отображаемый месяц
   */
  async getCurrentMonth(): Promise<string> {
    return this.getText(this.monthDisplay);
  }

  /**
   * Получает текущий отображаемый год
   */
  async getCurrentYear(): Promise<string> {
    return this.getText(this.yearDisplay);
  }

  /**
   * Кликает по событию
   */
  async clickOnEvent(eventId: string | number): Promise<void> {
    await step(`Клик по событию ${eventId}`, async () => {
      const event = this.getEventById(eventId);
      await this.safeClick(event);
    });
  }

  /**
   * Кликает по кнопке синхронизации
   */
  async clickSyncButton(): Promise<void> {
    await step('Клик по кнопке синхронизации', async () => {
      await this.safeClick(this.syncButton);
    });
  }
}
