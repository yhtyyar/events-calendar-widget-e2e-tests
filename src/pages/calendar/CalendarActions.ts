import { Page } from '@playwright/test';
import { CalendarPage } from './CalendarPage';
import { step, attachJSON, logStep } from '../../utils/allureHelper';
import { withRetry } from '../../utils/helpers';
import { TIMEOUTS } from '../../../config/test-data';

/**
 * EventData - структура данных события
 */
export interface EventData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  color?: string;
}

/**
 * CalendarActions - бизнес-логика для работы с календарем.
 * Содержит высокоуровневые операции: создание, редактирование, удаление событий.
 */
export class CalendarActions {
  private readonly page: Page;
  private readonly calendarPage: CalendarPage;

  constructor(page: Page) {
    this.page = page;
    this.calendarPage = new CalendarPage(page);
  }

  // ============ НАВИГАЦИЯ ============

  /**
   * Открывает страницу календаря
   */
  async openCalendar(): Promise<void> {
    await step('Открытие страницы календаря', async () => {
      await this.calendarPage.navigate();
      await this.calendarPage.waitForCalendarReady();
    });
  }

  /**
   * Переходит к определенному месяцу и году
   */
  async navigateToMonth(targetMonth: string, targetYear: string): Promise<void> {
    await step(`Переход к ${targetMonth} ${targetYear}`, async () => {
      const maxIterations = 24; // Максимум 2 года вперед/назад
      
      for (let i = 0; i < maxIterations; i++) {
        const currentMonth = await this.calendarPage.getCurrentMonth();
        const currentYear = await this.calendarPage.getCurrentYear();
        
        if (currentMonth.toLowerCase().includes(targetMonth.toLowerCase()) && 
            currentYear.includes(targetYear)) {
          logStep(`Достигнут целевой месяц: ${targetMonth} ${targetYear}`);
          return;
        }
        
        // Определяем направление навигации
        const targetDate = new Date(`${targetMonth} 1, ${targetYear}`);
        const currentDate = new Date(`${currentMonth} 1, ${currentYear}`);
        
        if (targetDate > currentDate) {
          await this.calendarPage.goToNextMonth();
        } else {
          await this.calendarPage.goToPreviousMonth();
        }
        
        await this.page.waitForTimeout(300); // Ждем анимацию
      }
      
      throw new Error(`Не удалось перейти к ${targetMonth} ${targetYear}`);
    });
  }

  // ============ РАБОТА С ФОРМОЙ СОБЫТИЙ ============

  /**
   * Заполняет форму события
   */
  async fillEventForm(data: EventData): Promise<void> {
    await step('Заполнение формы события', async () => {
      attachJSON('Event Data', data);
      
      // Ожидаем форму
      await this.calendarPage.waitForEventForm();
      
      // Заполняем обязательные поля
      await this.fillEventTitle(data.title);
      await this.fillEventStartDate(data.startDate);
      
      // Заполняем опциональные поля
      if (data.description) {
        await this.fillEventDescription(data.description);
      }
      
      if (data.endDate) {
        await this.fillEventEndDate(data.endDate);
      }
      
      if (data.startTime) {
        await this.fillEventStartTime(data.startTime);
      }
      
      if (data.endTime) {
        await this.fillEventEndTime(data.endTime);
      }
      
      if (data.color) {
        await this.selectEventColor(data.color);
      }
      
      logStep('Форма события заполнена');
    });
  }

  /**
   * Заполняет заголовок события
   */
  async fillEventTitle(title: string): Promise<void> {
    await step(`Ввод заголовка: ${title}`, async () => {
      await this.calendarPage.waitForElement(this.calendarPage.eventTitleInput);
      await this.calendarPage.eventTitleInput.clear();
      await this.calendarPage.eventTitleInput.fill(title);
    });
  }

  /**
   * Заполняет описание события
   */
  async fillEventDescription(description: string): Promise<void> {
    await step('Ввод описания события', async () => {
      await this.calendarPage.waitForElement(this.calendarPage.eventDescriptionInput);
      await this.calendarPage.eventDescriptionInput.clear();
      await this.calendarPage.eventDescriptionInput.fill(description);
    });
  }

  /**
   * Заполняет дату начала
   */
  async fillEventStartDate(date: string): Promise<void> {
    await step(`Ввод даты начала: ${date}`, async () => {
      await this.calendarPage.waitForElement(this.calendarPage.eventStartDateInput);
      await this.calendarPage.eventStartDateInput.clear();
      await this.calendarPage.eventStartDateInput.fill(date);
    });
  }

  /**
   * Заполняет дату окончания
   */
  async fillEventEndDate(date: string): Promise<void> {
    await step(`Ввод даты окончания: ${date}`, async () => {
      await this.calendarPage.waitForElement(this.calendarPage.eventEndDateInput);
      await this.calendarPage.eventEndDateInput.clear();
      await this.calendarPage.eventEndDateInput.fill(date);
    });
  }

  /**
   * Заполняет время начала
   */
  async fillEventStartTime(time: string): Promise<void> {
    await step(`Ввод времени начала: ${time}`, async () => {
      await this.calendarPage.waitForElement(this.calendarPage.eventStartTimeInput);
      await this.calendarPage.eventStartTimeInput.clear();
      await this.calendarPage.eventStartTimeInput.fill(time);
    });
  }

  /**
   * Заполняет время окончания
   */
  async fillEventEndTime(time: string): Promise<void> {
    await step(`Ввод времени окончания: ${time}`, async () => {
      await this.calendarPage.waitForElement(this.calendarPage.eventEndTimeInput);
      await this.calendarPage.eventEndTimeInput.clear();
      await this.calendarPage.eventEndTimeInput.fill(time);
    });
  }

  /**
   * Выбирает цвет события
   */
  async selectEventColor(color: string): Promise<void> {
    await step(`Выбор цвета: ${color}`, async () => {
      await this.calendarPage.waitForElement(this.calendarPage.eventColorPicker);
      await this.calendarPage.eventColorPicker.fill(color);
    });
  }

  /**
   * Отправляет форму события
   */
  async submitEventForm(): Promise<void> {
    await step('Отправка формы события', async () => {
      await withRetry(
        async () => {
          await this.calendarPage.safeClick(this.calendarPage.submitButton);
        },
        { maxAttempts: 3, delayMs: 500, operationName: 'Клик по кнопке отправки' }
      );
    });
  }

  /**
   * Отменяет создание/редактирование события
   */
  async cancelEventForm(): Promise<void> {
    await step('Отмена формы события', async () => {
      await this.calendarPage.safeClick(this.calendarPage.cancelButton);
    });
  }

  // ============ CRUD ОПЕРАЦИИ ============

  /**
   * Создает новое событие (полный флоу)
   */
  async createEvent(data: EventData): Promise<void> {
    await step(`Создание события: ${data.title}`, async () => {
      // Кликаем по дате начала для открытия формы
      await this.calendarPage.clickOnDay(data.startDate);
      
      // Заполняем форму
      await this.fillEventForm(data);
      
      // Отправляем
      await this.submitEventForm();
      
      // Ждем завершения
      await this.page.waitForLoadState('networkidle').catch(() => {});
      
      logStep(`Событие "${data.title}" создано`);
    });
  }

  /**
   * Редактирует существующее событие
   */
  async editEvent(eventId: string | number, data: Partial<EventData>): Promise<void> {
    await step(`Редактирование события ${eventId}`, async () => {
      // Открываем событие
      await this.calendarPage.clickOnEvent(eventId);
      
      // Ждем форму
      await this.calendarPage.waitForEventForm();
      
      // Обновляем поля
      if (data.title) await this.fillEventTitle(data.title);
      if (data.description) await this.fillEventDescription(data.description);
      if (data.startDate) await this.fillEventStartDate(data.startDate);
      if (data.endDate) await this.fillEventEndDate(data.endDate);
      if (data.startTime) await this.fillEventStartTime(data.startTime);
      if (data.endTime) await this.fillEventEndTime(data.endTime);
      if (data.color) await this.selectEventColor(data.color);
      
      // Сохраняем
      await this.submitEventForm();
      
      logStep(`Событие ${eventId} обновлено`);
    });
  }

  /**
   * Удаляет событие
   */
  async deleteEvent(eventId: string | number): Promise<void> {
    await step(`Удаление события ${eventId}`, async () => {
      // Открываем событие
      await this.calendarPage.clickOnEvent(eventId);
      
      // Ждем форму
      await this.calendarPage.waitForEventForm();
      
      // Кликаем удалить с retry
      await withRetry(
        async () => {
          await this.calendarPage.safeClick(this.calendarPage.deleteButton);
        },
        { maxAttempts: 3, delayMs: 500, operationName: 'Удаление события' }
      );
      
      // Подтверждаем удаление если есть модальное окно
      const confirmButton = this.page.locator('[data-testid="modal-confirm"], .confirm-delete, button:has-text("Удалить")');
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      }
      
      logStep(`Событие ${eventId} удалено`);
    });
  }

  // ============ СИНХРОНИЗАЦИЯ ============

  /**
   * Запускает синхронизацию календаря
   */
  async syncCalendar(): Promise<void> {
    await step('Синхронизация календаря', async () => {
      await this.calendarPage.clickSyncButton();
      await this.calendarPage.waitForSyncComplete();
      logStep('Синхронизация завершена');
    });
  }

  /**
   * Ожидает завершения синхронизации
   */
  async waitForSync(timeout = TIMEOUTS.NETWORK): Promise<void> {
    await this.calendarPage.waitForSyncComplete(timeout);
  }

  // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

  /**
   * Получает CalendarPage для прямого доступа к локаторам
   */
  getPage(): CalendarPage {
    return this.calendarPage;
  }
}
