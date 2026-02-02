/**
 * Централизованное хранилище тестовых данных и констант.
 * Облегчает поддержку и изменение данных без правки тестов.
 */

// URL-адреса тестируемых страниц
export const URLS = {
  EVENTS_WIDGET: '/eventswidget/',
  EVENTS_WIDGET_EN: '/en/eventswidget/',
} as const;

// Ожидаемые тексты на странице (для локализации RU)
export const EXPECTED_TEXTS = {
  // Основной заголовок страницы
  PAGE_TITLE: 'Конструктор календаря мероприятий',
  
  // Заголовок секции виджета
  MAIN_HEADING: 'Нравится наш календарь мероприятий?',
  
  // Описательный текст
  DESCRIPTION: 'Хочешь такой же?',
  
  // Инструкция по использованию
  INSTRUCTION: 'Просто сформируй календарь с подходящим тебе дизайном',
  
  // Текст про код вставки
  EMBED_CODE_INSTRUCTION: 'установи код вставки к себе на сайт',
} as const;

// Таймауты для различных операций (в миллисекундах)
export const TIMEOUTS = {
  // Стандартный таймаут для действий
  DEFAULT: 5000,
  
  // Таймаут для загрузки страницы
  PAGE_LOAD: 15000,
  
  // Таймаут для сетевых запросов
  NETWORK: 10000,
  
  // Короткий таймаут для быстрых проверок
  SHORT: 2000,
  
  // Таймаут для анимаций
  ANIMATION: 500,
} as const;

// Конфигурация viewport для различных устройств
export const VIEWPORTS = {
  MOBILE: { width: 375, height: 812 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1920, height: 1080 },
  DESKTOP_SMALL: { width: 1366, height: 768 },
} as const;

// Пороговые значения для проверок производительности
export const PERFORMANCE_THRESHOLDS = {
  // Максимальное время загрузки страницы (мс)
  MAX_PAGE_LOAD_TIME: 5000,
  
  // Максимальный размер страницы (байт)
  MAX_PAGE_SIZE: 5 * 1024 * 1024,
} as const;

// Паттерны для валидации
export const VALIDATION_PATTERNS = {
  // Паттерн для проверки HTML кода виджета
  EMBED_CODE: /<(iframe|script|div)[^>]*>/i,
  
  // Паттерн для проверки URL
  URL: /^https?:\/\/.+/i,
} as const;

// Теги для категоризации тестов
export const TEST_TAGS = {
  SMOKE: '@smoke',
  FUNCTIONAL: '@functional',
  VISUAL: '@visual',
  ACCESSIBILITY: '@accessibility',
  PERFORMANCE: '@performance',
  P0: '@P0',
  P1: '@P1',
  P2: '@P2',
} as const;

// Параметризованные тестовые данные для виджета
export const WIDGET_TEST_DATA = {
  // Дизайны виджета
  DESIGNS: [
    { name: 'modern', expectedClass: 'design-modern', description: 'Современный дизайн' },
    { name: 'classic', expectedClass: 'design-classic', description: 'Классический дизайн' },
    { name: 'minimal', expectedClass: 'design-minimal', description: 'Минималистичный дизайн' },
  ],
  
  // Цветовые темы
  COLOR_THEMES: [
    { name: 'blue', primaryColor: '#0066cc', description: 'Синяя тема' },
    { name: 'green', primaryColor: '#28a745', description: 'Зеленая тема' },
    { name: 'red', primaryColor: '#dc3545', description: 'Красная тема' },
  ],
  
  // Размеры виджета
  SIZES: [
    { name: 'small', width: 300, height: 200, description: 'Маленький размер' },
    { name: 'medium', width: 400, height: 300, description: 'Средний размер' },
    { name: 'large', width: 600, height: 400, description: 'Большой размер' },
  ],
} as const;

// Интерфейсы для типизации
export interface WidgetDesign {
  name: string;
  expectedClass: string;
  description: string;
}

export interface WidgetTheme {
  name: string;
  primaryColor: string;
  description: string;
}

export interface WidgetSize {
  name: string;
  width: number;
  height: number;
  description: string;
}
