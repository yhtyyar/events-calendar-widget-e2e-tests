/**
 * Утилита для визуальной фиксации результатов тестирования.
 * Позволяет создавать именованные скриншоты с чёткой структурой для идентификации тест-кейсов.
 */

import { Page, TestInfo } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';

// Базовая директория для артефактов
const ARTIFACTS_BASE_DIR = join(process.cwd(), 'test-artifacts');

/**
 * Создаёт скриншот с именованием по шагам теста.
 * Структура: test-artifacts/{project}/{test-id}/{run-id}/{state}__{step-name}__{timestamp}.png
 */
export async function captureStep(
  page: Page,
  testInfo: TestInfo,
  stepName: string,
  state: 'before' | 'after' | 'error'
): Promise<string> {
  // Формируем путь к артефакту
  const projectName = testInfo.project?.name || 'default';
  const testId = sanitizeTestId(testInfo.titlePath.slice(1).join('_'));
  const runId = process.env.TEST_RUN_ID || `unknown_${Date.now()}`;
  
  const artifactPath = join(
    ARTIFACTS_BASE_DIR,
    'visual',
    projectName,
    testId,
    runId
  );
  
  // Создаём директорию если не существует
  mkdirSync(artifactPath, { recursive: true });
  
  // Формат имени: [состояние]__[название-шага]__[таймстемп].png
  const timestamp = Date.now();
  const fileName = `${state}__${sanitizeFileName(stepName)}__${timestamp}.png`;
  const filePath = join(artifactPath, fileName);
  
  // Делаем скриншот
  await page.screenshot({ 
    path: filePath,
    fullPage: true,
    scale: 'css' // Корректный размер для HiDPI-экранов
  });
  
  // Логируем для отладки в GitHub Actions
  const relativePath = filePath.replace(process.cwd(), '');
  console.log(`📸 Captured: ${relativePath}`);
  
  // Прикрепляем скриншот к отчёту Playwright
  await testInfo.attach(`${state}: ${stepName}`, {
    path: filePath,
    contentType: 'image/png'
  });
  
  return filePath;
}

/**
 * Создаёт скриншот перед выполнением шага.
 */
export async function captureBeforeStep(
  page: Page,
  testInfo: TestInfo,
  stepName: string
): Promise<string> {
  return captureStep(page, testInfo, stepName, 'before');
}

/**
 * Создаёт скриншот после выполнения шага.
 */
export async function captureAfterStep(
  page: Page,
  testInfo: TestInfo,
  stepName: string
): Promise<string> {
  return captureStep(page, testInfo, stepName, 'after');
}

/**
 * Создаёт скриншот при ошибке.
 */
export async function captureErrorStep(
  page: Page,
  testInfo: TestInfo,
  stepName: string
): Promise<string> {
  return captureStep(page, testInfo, stepName, 'error');
}

/**
 * Декоратор для автоматической фиксации шага (before/after).
 */
export async function withVisualCapture<T>(
  page: Page,
  testInfo: TestInfo,
  stepName: string,
  action: () => Promise<T>
): Promise<T> {
  await captureBeforeStep(page, testInfo, stepName);
  
  try {
    const result = await action();
    await captureAfterStep(page, testInfo, stepName);
    return result;
  } catch (error) {
    await captureErrorStep(page, testInfo, stepName);
    throw error;
  }
}

/**
 * Санитизация имени файла - убираем недопустимые символы.
 */
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .slice(0, 50); // Ограничиваем длину
}

/**
 * Санитизация ID теста для использования в пути.
 */
function sanitizeTestId(id: string): string {
  return id
    .replace(/\s+/g, '-')
    .replace(/[:\[\]\/\\]/g, '_')
    .slice(0, 100); // Ограничиваем длину
}

/**
 * Возвращает путь к директории артефактов для текущего теста.
 */
export function getTestArtifactsPath(testInfo: TestInfo): string {
  const projectName = testInfo.project?.name || 'default';
  const testId = sanitizeTestId(testInfo.titlePath.slice(1).join('_'));
  const runId = process.env.TEST_RUN_ID || `unknown_${Date.now()}`;
  
  return join(ARTIFACTS_BASE_DIR, 'visual', projectName, testId, runId);
}

/**
 * Информация о структуре артефактов для логирования.
 */
export function logArtifactsInfo(testInfo: TestInfo): void {
  const path = getTestArtifactsPath(testInfo);
  console.log(`📁 Artifacts directory: ${path.replace(process.cwd(), '')}`);
  console.log(`🏷️  Test: ${testInfo.title}`);
  console.log(`🔧 Project: ${testInfo.project?.name || 'default'}`);
  console.log(`🆔 Run ID: ${process.env.TEST_RUN_ID || 'unknown'}`);
}
