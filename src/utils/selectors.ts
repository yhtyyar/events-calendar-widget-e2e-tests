/**
 * Централизованное хранилище селекторов элементов.
 * Упрощает поддержку при изменениях в UI.
 * 
 * Стратегия выбора селекторов:
 * 1. Приоритет: data-testid атрибуты (если доступны)
 * 2. Семантические селекторы (роли, ARIA-метки)
 * 3. Текстовое содержимое (для стабильных текстов)
 * 4. CSS-селекторы (как fallback)
 */

export const SELECTORS = {
  // Основные элементы страницы
  PAGE: {
    // Контейнер основного контента
    MAIN_CONTENT: 'main, .main-content, #content, article',
    
    // Заголовок страницы
    PAGE_TITLE: 'h1',
    
    // Секция с виджетом
    WIDGET_SECTION: '.widget-section, .events-widget, section',
  },

  // Элементы виджета календаря
  WIDGET: {
    // Основной заголовок виджета
    HEADING: 'text="Нравится наш календарь мероприятий?"',
    HEADING_PARTIAL: 'text=/календарь мероприятий/i',
    
    // Описательный текст
    DESCRIPTION: 'text="Хочешь такой же?"',
    DESCRIPTION_PARTIAL: 'text=/такой же/i',
    
    // Контейнер формы генерации
    FORM_CONTAINER: 'form, .widget-form, .generator-form',
    
    // Поле с кодом вставки
    EMBED_CODE_FIELD: 'textarea, input[type="text"][readonly], .embed-code, code',
    
    // Кнопка копирования
    COPY_BUTTON: 'button:has-text("копировать"), button:has-text("Копировать"), [data-action="copy"]',
    
    // Селектор дизайна/темы
    DESIGN_SELECTOR: 'select, .design-selector, [data-type="design"]',
    
    // Превью виджета
    PREVIEW: '.preview, .widget-preview, iframe',
  },

  // Навигационные элементы
  NAVIGATION: {
    // Основное меню
    MAIN_MENU: 'nav, .navigation, .menu',
    
    // Ссылка на календарь мероприятий
    EVENTS_LINK: 'a[href*="activity"], a:has-text("мероприятий")',
    
    // Переключатель языка
    LANGUAGE_SWITCHER: '.language-switcher, [data-lang], a[href*="/en/"]',
  },

  // Элементы футера
  FOOTER: {
    CONTAINER: 'footer, .footer',
    COPYRIGHT: '.copyright, text=/3SNET/i',
  },

  // Общие элементы
  COMMON: {
    // Любой загружаемый контент
    LOADING: '.loading, .spinner, [aria-busy="true"]',
    
    // Сообщения об ошибках
    ERROR_MESSAGE: '.error, .alert-error, [role="alert"]',
    
    // Успешные уведомления
    SUCCESS_MESSAGE: '.success, .alert-success',
  },
} as const;

/**
 * Получение селектора по пути (например: 'WIDGET.HEADING')
 */
export function getSelector(path: string): string {
  const parts = path.split('.');
  let result: unknown = SELECTORS;
  
  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = (result as Record<string, unknown>)[part];
    } else {
      throw new Error(`Селектор не найден: ${path}`);
    }
  }
  
  if (typeof result !== 'string') {
    throw new Error(`Некорректный путь к селектору: ${path}`);
  }
  
  return result;
}
