import { TestInfo } from '@playwright/test';
import * as path from 'path';

/**
 * Утилита для структурированного именования скриншотов и артефактов тестов.
 * Обеспечивает понятные и консистентные названия для тестовой документации.
 */

/**
 * Категории тестов для структурирования отчетов
 */
export const TEST_CATEGORIES = {
  SMOKE: {
    id: 'smoke',
    name: 'Smoke-тесты',
    description: 'Базовая проверка работоспособности',
    priority: 'P0',
  },
  FUNCTIONAL: {
    id: 'functional',
    name: 'Функциональные тесты',
    description: 'Проверка бизнес-логики',
    priority: 'P0',
  },
  VISUAL: {
    id: 'visual',
    name: 'Визуальные тесты',
    description: 'Проверка адаптивности и отображения',
    priority: 'P1',
  },
  ACCESSIBILITY: {
    id: 'accessibility',
    name: 'Тесты доступности',
    description: 'Проверка соответствия WCAG',
    priority: 'P2',
  },
} as const;

/**
 * Типы скриншотов для классификации
 */
export enum ScreenshotType {
  FAILURE = 'ошибка',
  STEP = 'шаг',
  COMPARISON = 'сравнение',
  FULL_PAGE = 'полная-страница',
  ELEMENT = 'элемент',
}

/**
 * Интерфейс для метаданных скриншота
 */
export interface ScreenshotMetadata {
  testId: string;
  testName: string;
  category: string;
  browser: string;
  viewport: string;
  type: ScreenshotType;
  step?: string;
  timestamp: string;
}

/**
 * Транслитерация русского текста в латиницу для имен файлов
 */
function transliterate(text: string): string {
  const charMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', '_': '-',
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => charMap[char] || char)
    .join('')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Извлечение ID теста из названия (например, SMOKE-01 из "SMOKE-01: Описание")
 */
function extractTestId(testName: string): string {
  const match = testName.match(/^([A-Z]+-\d+)/);
  return match ? match[1] : '';
}

/**
 * Форматирование timestamp для имени файла
 */
function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
}

/**
 * Определение категории теста по пути файла или тегам
 */
function detectCategory(testInfo: TestInfo): string {
  const filePath = testInfo.file;
  
  if (filePath.includes('/smoke/')) return TEST_CATEGORIES.SMOKE.id;
  if (filePath.includes('/functional/')) return TEST_CATEGORIES.FUNCTIONAL.id;
  if (filePath.includes('/visual/')) return TEST_CATEGORIES.VISUAL.id;
  if (filePath.includes('/accessibility/')) return TEST_CATEGORIES.ACCESSIBILITY.id;
  
  // Fallback по тегам в названии
  const title = testInfo.title.toLowerCase();
  if (title.includes('@smoke')) return TEST_CATEGORIES.SMOKE.id;
  if (title.includes('@functional')) return TEST_CATEGORIES.FUNCTIONAL.id;
  if (title.includes('@visual')) return TEST_CATEGORIES.VISUAL.id;
  if (title.includes('@accessibility') || title.includes('@a11y')) return TEST_CATEGORIES.ACCESSIBILITY.id;
  
  return 'other';
}

/**
 * Получение информации о viewport
 */
function getViewportInfo(testInfo: TestInfo): string {
  const project = testInfo.project;
  const viewport = project.use?.viewport;
  
  if (viewport) {
    return `${viewport.width}x${viewport.height}`;
  }
  
  // Fallback для мобильных устройств
  if (project.name?.includes('mobile')) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Генерация структурированного имени скриншота
 * 
 * Формат: [категория]/[браузер]/[ID-теста]_[описание]_[viewport]_[тип]_[timestamp].png
 * Пример: smoke/chromium/SMOKE-01_загрузка-страницы_1920x1080_ошибка_2024-01-15_10-30-00.png
 */
export function generateScreenshotName(
  testInfo: TestInfo,
  type: ScreenshotType = ScreenshotType.FAILURE,
  stepDescription?: string
): string {
  const category = detectCategory(testInfo);
  const browser = testInfo.project.name || 'unknown';
  const testId = extractTestId(testInfo.title) || 'TEST';
  const viewport = getViewportInfo(testInfo);
  const timestamp = formatTimestamp();
  
  // Извлекаем описание теста (после ID)
  const descriptionMatch = testInfo.title.match(/^[A-Z]+-\d+:\s*(.+)$/);
  const description = descriptionMatch 
    ? transliterate(descriptionMatch[1].slice(0, 50))
    : transliterate(testInfo.title.slice(0, 50));
  
  // Добавляем описание шага если есть
  const stepPart = stepDescription ? `_${transliterate(stepDescription)}` : '';
  
  const fileName = `${testId}_${description}${stepPart}_${viewport}_${type}_${timestamp}.png`;
  
  return path.join(category, browser, fileName);
}

/**
 * Генерация пути для директории скриншотов теста
 */
export function getScreenshotDirectory(testInfo: TestInfo): string {
  const category = detectCategory(testInfo);
  const browser = testInfo.project.name || 'unknown';
  
  return path.join('reports', 'screenshots', category, browser);
}

/**
 * Генерация понятного названия теста для отчета
 * Преобразует технический ID в читаемый формат
 */
export function formatTestNameForReport(testInfo: TestInfo): string {
  const testId = extractTestId(testInfo.title);
  const category = detectCategory(testInfo);
  const categoryInfo = Object.values(TEST_CATEGORIES).find(c => c.id === category);
  
  // Формат: [Категория] ID: Описание
  const prefix = categoryInfo ? `[${categoryInfo.name}]` : '';
  
  return `${prefix} ${testInfo.title}`;
}

/**
 * Генерация метаданных для скриншота (для Allure и других отчетов)
 */
export function generateScreenshotMetadata(
  testInfo: TestInfo,
  type: ScreenshotType,
  step?: string
): ScreenshotMetadata {
  return {
    testId: extractTestId(testInfo.title) || 'UNKNOWN',
    testName: testInfo.title,
    category: detectCategory(testInfo),
    browser: testInfo.project.name || 'unknown',
    viewport: getViewportInfo(testInfo),
    type,
    step,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Словарь читаемых названий для статусов тестов
 */
export const TEST_STATUS_NAMES = {
  passed: 'Пройден',
  failed: 'Не пройден',
  timedOut: 'Таймаут',
  skipped: 'Пропущен',
  interrupted: 'Прерван',
} as const;

/**
 * Словарь читаемых названий для браузеров
 */
export const BROWSER_NAMES = {
  chromium: 'Chrome',
  firefox: 'Firefox',
  webkit: 'Safari',
  'mobile-chrome': 'Chrome Mobile (Pixel 5)',
  'mobile-safari': 'Safari Mobile (iPhone 12)',
} as const;

/**
 * Получение читаемого названия браузера
 */
export function getBrowserDisplayName(browserName: string): string {
  return BROWSER_NAMES[browserName as keyof typeof BROWSER_NAMES] || browserName;
}

/**
 * Получение читаемого статуса теста
 */
export function getStatusDisplayName(status: string): string {
  return TEST_STATUS_NAMES[status as keyof typeof TEST_STATUS_NAMES] || status;
}
