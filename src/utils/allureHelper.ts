import { test } from '@playwright/test';
import * as allure from 'allure-playwright';

/**
 * Утилиты для работы с Allure отчетами.
 * Предоставляет обертки для добавления шагов, вложений и метаданных.
 */

// ============ ТИПЫ ============
export type AllureStatus = 'passed' | 'failed' | 'broken' | 'skipped';
export type AllureSeverity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
export type AllureLabel = 'epic' | 'feature' | 'story' | 'suite' | 'subSuite' | 'parentSuite';

// ============ ШАГИ ============

/**
 * Добавляет шаг в Allure отчет
 * @param name Название шага
 * @param body Тело шага (функция)
 */
export async function step<T>(name: string, body: () => Promise<T>): Promise<T> {
  return test.step(name, body);
}

/**
 * Добавляет информационный шаг без действий
 */
export function logStep(message: string, status: AllureStatus = 'passed'): void {
  test.info().annotations.push({
    type: 'step',
    description: `[${status.toUpperCase()}] ${message}`,
  });
}

/**
 * Оборачивает действие в Allure шаг с автоматическим статусом
 */
export async function wrapInStep<T>(
  stepName: string,
  action: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T> {
  return test.step(stepName, async () => {
    try {
      const result = await action();
      logStep(`✓ ${stepName}`, 'passed');
      return result;
    } catch (error) {
      logStep(`✗ ${stepName}: ${error instanceof Error ? error.message : String(error)}`, 'failed');
      if (onError && error instanceof Error) {
        onError(error);
      }
      throw error;
    }
  });
}

// ============ МЕТАДАННЫЕ ============

/**
 * Добавляет severity к тесту
 */
export function setSeverity(severity: AllureSeverity): void {
  test.info().annotations.push({
    type: 'severity',
    description: severity,
  });
}

/**
 * Добавляет epic/feature/story метки
 */
export function setLabel(type: AllureLabel, value: string): void {
  test.info().annotations.push({
    type: type,
    description: value,
  });
}

/**
 * Добавляет ссылку на issue/defect
 */
export function addIssueLink(issueId: string, url?: string): void {
  test.info().annotations.push({
    type: 'issue',
    description: url || issueId,
  });
}

/**
 * Добавляет ссылку на TMS (Test Management System)
 */
export function addTmsLink(testId: string, url?: string): void {
  test.info().annotations.push({
    type: 'tms',
    description: url || testId,
  });
}

/**
 * Добавляет описание к тесту
 */
export function setDescription(description: string): void {
  test.info().annotations.push({
    type: 'description',
    description: description,
  });
}

// ============ ВЛОЖЕНИЯ ============

/**
 * Добавляет текстовое вложение
 */
export function attachText(name: string, content: string): void {
  test.info().attachments.push({
    name: name,
    contentType: 'text/plain',
    body: Buffer.from(content),
  });
}

/**
 * Добавляет JSON вложение
 */
export function attachJSON(name: string, data: object): void {
  test.info().attachments.push({
    name: name,
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(data, null, 2)),
  });
}

/**
 * Добавляет HTML вложение
 */
export function attachHTML(name: string, html: string): void {
  test.info().attachments.push({
    name: name,
    contentType: 'text/html',
    body: Buffer.from(html),
  });
}

/**
 * Добавляет скриншот как вложение
 */
export function attachScreenshot(name: string, screenshot: Buffer): void {
  test.info().attachments.push({
    name: name,
    contentType: 'image/png',
    body: screenshot,
  });
}

// ============ ПАРАМЕТРЫ ============

/**
 * Добавляет параметр теста для отображения в отчете
 */
export function addParameter(name: string, value: string): void {
  test.info().annotations.push({
    type: 'parameter',
    description: `${name}: ${value}`,
  });
}

/**
 * Добавляет несколько параметров
 */
export function addParameters(params: Record<string, string | number | boolean>): void {
  Object.entries(params).forEach(([key, value]) => {
    addParameter(key, String(value));
  });
}

// ============ КАТЕГОРИИ ТЕСТОВ ============

/**
 * Маркирует тест как flaky (нестабильный)
 */
export function markAsFlaky(reason?: string): void {
  test.info().annotations.push({
    type: 'flaky',
    description: reason || 'Known flaky test',
  });
}

/**
 * Маркирует тест как критический
 */
export function markAsCritical(): void {
  setSeverity('critical');
  test.info().annotations.push({
    type: 'tag',
    description: '@critical',
  });
}

/**
 * Маркирует тест для записи видео
 */
export function markForVideo(): void {
  test.info().annotations.push({
    type: 'tag',
    description: '@video',
  });
}

// ============ ДЕКОРАТОРЫ ДЛЯ PAGE OBJECT МЕТОДОВ ============

/**
 * Декоратор для автоматического добавления шагов Allure
 * Использование: @allureStep('Описание шага')
 */
export function allureStep(stepName: string) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      return test.step(stepName, async () => {
        return originalMethod.apply(this, args);
      });
    };
    
    return descriptor;
  };
}

// ============ КОНТЕКСТ ТЕСТА ============

/**
 * Создает контекст теста для структурированного логирования
 */
export function createTestContext(testName: string) {
  const startTime = Date.now();
  
  return {
    startStep: (name: string) => logStep(`▶ ${name}`, 'passed'),
    endStep: (name: string) => logStep(`✓ ${name}`, 'passed'),
    failStep: (name: string, error: string) => logStep(`✗ ${name}: ${error}`, 'failed'),
    
    getDuration: () => Date.now() - startTime,
    
    complete: () => {
      const duration = Date.now() - startTime;
      attachText('Test Duration', `${testName} completed in ${duration}ms`);
    },
  };
}

// ============ ЭКСПОРТ ALLURE МОДУЛЯ ============
export { allure };
