import { TestInfo, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { 
  generateScreenshotName, 
  getScreenshotDirectory, 
  ScreenshotType,
  generateScreenshotMetadata,
  TEST_CATEGORIES,
  getBrowserDisplayName,
  getStatusDisplayName 
} from './screenshot-naming';

/**
 * Хелпер для работы со скриншотами и отчетами в тестах.
 * Обеспечивает структурированное именование и организацию артефактов.
 */

/**
 * Создание директории если не существует
 */
function ensureDirectoryExists(dirPath: string): void {
  const fullPath = path.resolve(dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

/**
 * Сохранение скриншота с структурированным именем
 */
export async function saveScreenshot(
  page: Page,
  testInfo: TestInfo,
  type: ScreenshotType = ScreenshotType.STEP,
  stepDescription?: string,
  options: { fullPage?: boolean; element?: string } = {}
): Promise<string> {
  const screenshotDir = getScreenshotDirectory(testInfo);
  ensureDirectoryExists(screenshotDir);
  
  const screenshotName = generateScreenshotName(testInfo, type, stepDescription);
  const screenshotPath = path.join('reports', 'screenshots', screenshotName);
  
  // Создаем директорию для скриншота
  ensureDirectoryExists(path.dirname(screenshotPath));
  
  // Делаем скриншот
  if (options.element) {
    await page.locator(options.element).screenshot({ path: screenshotPath });
  } else {
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: options.fullPage ?? true 
    });
  }
  
  // Прикрепляем к отчету Playwright
  const metadata = generateScreenshotMetadata(testInfo, type, stepDescription);
  await testInfo.attach(formatAttachmentName(testInfo, type, stepDescription), {
    path: screenshotPath,
    contentType: 'image/png',
  });
  
  return screenshotPath;
}

/**
 * Форматирование имени вложения для отчета
 */
function formatAttachmentName(
  testInfo: TestInfo,
  type: ScreenshotType,
  stepDescription?: string
): string {
  const browser = getBrowserDisplayName(testInfo.project.name || 'unknown');
  const step = stepDescription ? ` - ${stepDescription}` : '';
  
  return `[${browser}] ${type}${step}`;
}

/**
 * Сохранение скриншота при ошибке с дополнительной информацией
 */
export async function saveFailureScreenshot(
  page: Page,
  testInfo: TestInfo,
  errorMessage?: string
): Promise<string> {
  const screenshotPath = await saveScreenshot(
    page, 
    testInfo, 
    ScreenshotType.FAILURE,
    'при-ошибке'
  );
  
  // Добавляем информацию об ошибке в отчет
  if (errorMessage) {
    await testInfo.attach('Описание ошибки', {
      body: errorMessage,
      contentType: 'text/plain',
    });
  }
  
  return screenshotPath;
}

/**
 * Сохранение скриншота шага теста
 */
export async function saveStepScreenshot(
  page: Page,
  testInfo: TestInfo,
  stepName: string
): Promise<string> {
  return saveScreenshot(page, testInfo, ScreenshotType.STEP, stepName);
}

/**
 * Добавление аннотации к тесту для отчета
 */
export function addTestAnnotation(
  testInfo: TestInfo,
  type: 'info' | 'warning' | 'error' | 'step',
  description: string
): void {
  testInfo.annotations.push({ type, description });
}

/**
 * Добавление описания теста для отчета Allure
 */
export function setTestDescription(
  testInfo: TestInfo,
  description: string
): void {
  testInfo.annotations.push({ 
    type: 'description', 
    description 
  });
}

/**
 * Добавление категории теста
 */
export function setTestCategory(
  testInfo: TestInfo,
  categoryId: keyof typeof TEST_CATEGORIES
): void {
  const category = TEST_CATEGORIES[categoryId];
  testInfo.annotations.push({
    type: 'category',
    description: `${category.name} (${category.priority})`,
  });
}

/**
 * Логирование шага теста с возможностью скриншота
 */
export async function logTestStep(
  page: Page,
  testInfo: TestInfo,
  stepName: string,
  action: () => Promise<void>,
  options: { screenshot?: boolean } = {}
): Promise<void> {
  addTestAnnotation(testInfo, 'step', `Начало: ${stepName}`);
  
  try {
    await action();
    addTestAnnotation(testInfo, 'step', `Успешно: ${stepName}`);
    
    if (options.screenshot) {
      await saveStepScreenshot(page, testInfo, stepName);
    }
  } catch (error) {
    addTestAnnotation(testInfo, 'error', `Ошибка в шаге: ${stepName}`);
    await saveFailureScreenshot(page, testInfo, String(error));
    throw error;
  }
}

/**
 * Генерация сводки по тесту для отчета
 */
export function generateTestSummary(testInfo: TestInfo): string {
  const browser = getBrowserDisplayName(testInfo.project.name || 'unknown');
  const status = getStatusDisplayName(testInfo.status || 'unknown');
  const duration = testInfo.duration ? `${(testInfo.duration / 1000).toFixed(2)}с` : 'N/A';
  
  return `
Тест: ${testInfo.title}
Браузер: ${browser}
Статус: ${status}
Длительность: ${duration}
Повторных запусков: ${testInfo.retry}
`.trim();
}

/**
 * Структура для именования артефактов видео
 */
export function generateVideoName(testInfo: TestInfo): string {
  const category = testInfo.file.includes('/smoke/') ? 'smoke' :
                   testInfo.file.includes('/functional/') ? 'functional' :
                   testInfo.file.includes('/visual/') ? 'visual' :
                   testInfo.file.includes('/accessibility/') ? 'accessibility' : 'other';
  
  const browser = testInfo.project.name || 'unknown';
  const testId = testInfo.title.match(/^([A-Z]+-\d+)/)?.[1] || 'TEST';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  return path.join(category, browser, `${testId}_видео_${timestamp}.webm`);
}
