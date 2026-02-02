/**
 * Environment-specific конфигурация для тестов.
 * Позволяет адаптировать поведение тестов под разные окружения.
 */

export interface EnvironmentConfig {
  baseURL: string;
  timeout: {
    default: number;
    pageLoad: number;
    network: number;
  };
  retries: number;
  workers?: number;
  headless: boolean;
  slowMo?: number;
}

export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  development: {
    baseURL: 'http://localhost:3000',
    timeout: {
      default: 30000,
      pageLoad: 20000,
      network: 15000,
    },
    retries: 0,
    workers: 1,
    headless: false,
    slowMo: 100,
  },
  
  staging: {
    baseURL: 'https://dev.3snet.info',
    timeout: {
      default: 20000,
      pageLoad: 15000,
      network: 10000,
    },
    retries: 1,
    workers: 2,
    headless: true,
  },
  
  production: {
    baseURL: 'https://3snet.info',
    timeout: {
      default: 15000,
      pageLoad: 10000,
      network: 8000,
    },
    retries: 2,
    workers: 4,
    headless: true,
  },
  
  ci: {
    baseURL: process.env.BASE_URL || 'https://dev.3snet.info',
    timeout: {
      default: 30000,
      pageLoad: 15000,
      network: 10000,
    },
    retries: 2,
    workers: 2,
    headless: true,
  },
} as const;

/**
 * Получение текущей конфигурации окружения
 */
export function getCurrentEnvironment(): EnvironmentConfig {
  const envName = process.env.NODE_ENV || process.env.ENV || 'staging';
  
  if (envName === 'ci') {
    return ENVIRONMENTS.ci;
  }
  
  return ENVIRONMENTS[envName] || ENVIRONMENTS.staging;
}

/**
 * Получение URL для текущего окружения
 */
export function getBaseUrl(): string {
  return getCurrentEnvironment().baseURL;
}

/**
 * Проверка что текущее окружение - CI
 */
export function isCI(): boolean {
  return process.env.CI === 'true' || process.env.NODE_ENV === 'ci';
}

/**
 * Получение оптимального количества workers для текущего окружения
 */
export function getOptimalWorkers(): number | undefined {
  const env = getCurrentEnvironment();
  return env.workers || (isCI() ? 2 : undefined);
}
