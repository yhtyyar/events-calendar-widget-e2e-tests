/**
 * Централизованное хранилище селекторов элементов.
 * Упрощает поддержку при изменениях в UI.
 * 
 * Стратегия выбора селекторов (приоритет):
 * 1. data-testid атрибуты (наиболее стабильные)
 * 2. Семантические селекторы (роли, ARIA-метки)
 * 3. Fallback CSS-селекторы (для обратной совместимости)
 * 
 * ВАЖНО: Все новые элементы должны использовать data-testid
 */

// ============ DATA-TESTID СЕЛЕКТОРЫ (ПРИОРИТЕТНЫЕ) ============
export const CALENDAR_SELECTORS = {
  // Элементы календаря
  calendarContainer: '[data-testid="calendar-container"]',
  calendarItem: '[data-testid="calendar-item"]',
  calendarHeader: '[data-testid="calendar-header"]',
  calendarBody: '[data-testid="calendar-body"]',
  calendarDay: '[data-testid="calendar-day"]',
  calendarMonth: '[data-testid="calendar-month"]',
  calendarYear: '[data-testid="calendar-year"]',
  calendarNavPrev: '[data-testid="calendar-nav-prev"]',
  calendarNavNext: '[data-testid="calendar-nav-next"]',
  
  // Форма событий
  eventForm: '[data-testid="event-form"]',
  eventTitleInput: '[data-testid="event-title-input"]',
  eventDescriptionInput: '[data-testid="event-description-input"]',
  eventStartDate: '[data-testid="event-start-date"]',
  eventEndDate: '[data-testid="event-end-date"]',
  eventStartTime: '[data-testid="event-start-time"]',
  eventEndTime: '[data-testid="event-end-time"]',
  eventColorPicker: '[data-testid="event-color-picker"]',
  submitButton: '[data-testid="submit-event"]',
  cancelButton: '[data-testid="cancel-event"]',
  deleteButton: '[data-testid="delete-event"]',
  
  // События
  eventItem: '[data-testid="event-item"]',
  eventTitle: '[data-testid="event-title"]',
  eventDate: '[data-testid="event-date"]',
  eventTime: '[data-testid="event-time"]',
  
  // Синхронизация
  syncButton: '[data-testid="sync-button"]',
  syncStatus: '[data-testid="sync-status"]',
  syncIndicator: '[data-testid="sync-indicator"]',
} as const;

export const AUTH_SELECTORS = {
  // Авторизация
  loginForm: '[data-testid="login-form"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  loginButton: '[data-testid="login-button"]',
  logoutButton: '[data-testid="logout-button"]',
  rememberMeCheckbox: '[data-testid="remember-me"]',
  forgotPasswordLink: '[data-testid="forgot-password"]',
  registerLink: '[data-testid="register-link"]',
  userAvatar: '[data-testid="user-avatar"]',
  userName: '[data-testid="user-name"]',
} as const;

export const WIDGET_SELECTORS = {
  // Виджет генератор
  widgetContainer: '[data-testid="widget-container"]',
  widgetHeading: '[data-testid="widget-heading"]',
  widgetDescription: '[data-testid="widget-description"]',
  widgetPreview: '[data-testid="widget-preview"]',
  embedCodeField: '[data-testid="embed-code-field"]',
  copyButton: '[data-testid="copy-button"]',
  copySuccessMessage: '[data-testid="copy-success"]',
  designSelector: '[data-testid="design-selector"]',
  designOption: '[data-testid="design-option"]',
  colorThemeSelector: '[data-testid="color-theme-selector"]',
  sizeSelector: '[data-testid="size-selector"]',
  generateButton: '[data-testid="generate-button"]',
} as const;

export const NAVIGATION_SELECTORS = {
  // Навигация
  mainMenu: '[data-testid="main-menu"]',
  menuItem: '[data-testid="menu-item"]',
  eventsLink: '[data-testid="events-link"]',
  calendarLink: '[data-testid="calendar-link"]',
  settingsLink: '[data-testid="settings-link"]',
  languageSwitcher: '[data-testid="language-switcher"]',
  breadcrumbs: '[data-testid="breadcrumbs"]',
} as const;

export const COMMON_SELECTORS = {
  // Общие UI элементы
  loadingSpinner: '[data-testid="loading-spinner"]',
  loadingOverlay: '[data-testid="loading-overlay"]',
  errorMessage: '[data-testid="error-message"]',
  successMessage: '[data-testid="success-message"]',
  warningMessage: '[data-testid="warning-message"]',
  modal: '[data-testid="modal"]',
  modalClose: '[data-testid="modal-close"]',
  modalConfirm: '[data-testid="modal-confirm"]',
  modalCancel: '[data-testid="modal-cancel"]',
  toast: '[data-testid="toast"]',
  tooltip: '[data-testid="tooltip"]',
  dropdown: '[data-testid="dropdown"]',
  dropdownItem: '[data-testid="dropdown-item"]',
} as const;

export const FOOTER_SELECTORS = {
  // Футер
  footerContainer: '[data-testid="footer"]',
  footerCopyright: '[data-testid="footer-copyright"]',
  footerLinks: '[data-testid="footer-links"]',
  socialLinks: '[data-testid="social-links"]',
} as const;

// ============ FALLBACK СЕЛЕКТОРЫ (ОБРАТНАЯ СОВМЕСТИМОСТЬ) ============
// Используются когда data-testid отсутствуют на странице

export const FALLBACK_SELECTORS = {
  PAGE: {
    MAIN_CONTENT: 'main, .main-content, #content, article',
    PAGE_TITLE: 'h1',
    WIDGET_SECTION: '.widget-section, .events-widget, section',
  },

  WIDGET: {
    HEADING: 'text="Нравится наш календарь мероприятий?"',
    HEADING_PARTIAL: 'text=/календарь мероприятий/i',
    DESCRIPTION: 'text="Хочешь такой же?"',
    DESCRIPTION_PARTIAL: 'text=/такой же/i',
    FORM_CONTAINER: 'form, .widget-form, .generator-form',
    EMBED_CODE_FIELD: 'textarea, input[type="text"][readonly], .embed-code, code',
    COPY_BUTTON: 'button:has-text("копировать"), button:has-text("Копировать"), [data-action="copy"]',
    DESIGN_SELECTOR: 'select, .design-selector, [data-type="design"]',
    PREVIEW: '.preview, .widget-preview, iframe',
  },

  NAVIGATION: {
    MAIN_MENU: 'nav, .navigation, .menu',
    EVENTS_LINK: 'a[href*="activity"], a:has-text("мероприятий")',
    LANGUAGE_SWITCHER: '.language-switcher, [data-lang], a[href*="/en/"]',
  },

  FOOTER: {
    CONTAINER: 'footer, .footer',
    COPYRIGHT: '.copyright, text=/3SNET/i',
  },

  COMMON: {
    LOADING: '.loading, .spinner, [aria-busy="true"]',
    ERROR_MESSAGE: '.error, .alert-error, [role="alert"]',
    SUCCESS_MESSAGE: '.success, .alert-success',
  },
} as const;

// Сохраняем старый интерфейс для обратной совместимости
export const SELECTORS = FALLBACK_SELECTORS;

// ============ ТИПЫ ============
export type CalendarSelector = keyof typeof CALENDAR_SELECTORS;
export type AuthSelector = keyof typeof AUTH_SELECTORS;
export type WidgetSelector = keyof typeof WIDGET_SELECTORS;
export type NavigationSelector = keyof typeof NAVIGATION_SELECTORS;
export type CommonSelector = keyof typeof COMMON_SELECTORS;
export type FooterSelector = keyof typeof FOOTER_SELECTORS;

// ============ УТИЛИТЫ ============

/**
 * Создает селектор с динамическим data-testid
 * @example createTestIdSelector('event-item', 123) => '[data-testid="event-item-123"]'
 */
export function createTestIdSelector(base: string, id?: string | number): string {
  if (id !== undefined) {
    return `[data-testid="${base}-${id}"]`;
  }
  return `[data-testid="${base}"]`;
}

/**
 * Создает селектор по индексу элемента
 * @example createNthSelector('[data-testid="event-item"]', 2) => '[data-testid="event-item"]:nth-child(2)'
 */
export function createNthSelector(selector: string, index: number): string {
  return `${selector}:nth-child(${index})`;
}

/**
 * Комбинирует несколько селекторов через запятую (OR логика)
 */
export function combineSelectors(...selectors: string[]): string {
  return selectors.join(', ');
}

/**
 * Создает селектор потомка
 * @example createDescendantSelector('[data-testid="form"]', '[data-testid="input"]')
 */
export function createDescendantSelector(parent: string, child: string): string {
  return `${parent} ${child}`;
}

/**
 * Получает data-testid селектор с fallback на CSS селектор
 */
export function getTestIdOrFallback(testIdSelector: string, fallbackSelector: string): string {
  return combineSelectors(testIdSelector, fallbackSelector);
}
