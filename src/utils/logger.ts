/**
 * Модуль логирования для тестов.
 * Обеспечивает структурированный вывод информации для отладки.
 */

// Уровни логирования
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Текущий уровень логирования (настраивается через переменные окружения)
const currentLevel = process.env.LOG_LEVEL
  ? (LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] ?? LogLevel.INFO)
  : LogLevel.INFO;

// Цвета для консольного вывода
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
} as const;

/**
 * Форматирование временной метки
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Форматирование сообщения для вывода
 */
function formatMessage(level: string, message: string, context?: string): string {
  const timestamp = getTimestamp();
  const contextStr = context ? `[${context}]` : '';
  return `${COLORS.dim}${timestamp}${COLORS.reset} ${level} ${contextStr} ${message}`;
}

/**
 * Класс логгера
 */
class Logger {
  private context: string;

  constructor(context = 'Test') {
    this.context = context;
  }

  /**
   * Создание дочернего логгера с новым контекстом
   */
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }

  /**
   * Отладочное сообщение
   */
  debug(message: string, data?: unknown): void {
    if (currentLevel <= LogLevel.DEBUG) {
      const formatted = formatMessage(
        `${COLORS.cyan}DEBUG${COLORS.reset}`,
        message,
        this.context
      );
      console.log(formatted);
      if (data !== undefined) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Информационное сообщение
   */
  info(message: string, data?: unknown): void {
    if (currentLevel <= LogLevel.INFO) {
      const formatted = formatMessage(
        `${COLORS.green}INFO${COLORS.reset}`,
        message,
        this.context
      );
      console.log(formatted);
      if (data !== undefined) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Предупреждение
   */
  warn(message: string, data?: unknown): void {
    if (currentLevel <= LogLevel.WARN) {
      const formatted = formatMessage(
        `${COLORS.yellow}WARN${COLORS.reset}`,
        message,
        this.context
      );
      console.warn(formatted);
      if (data !== undefined) {
        console.warn(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Ошибка
   */
  error(message: string, error?: Error | unknown): void {
    if (currentLevel <= LogLevel.ERROR) {
      const formatted = formatMessage(
        `${COLORS.red}ERROR${COLORS.reset}`,
        message,
        this.context
      );
      console.error(formatted);
      if (error instanceof Error) {
        console.error(`${COLORS.red}${error.stack}${COLORS.reset}`);
      } else if (error !== undefined) {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  }

  /**
   * Логирование начала тестового шага
   */
  step(stepName: string): void {
    this.info(`▶ Шаг: ${stepName}`);
  }

  /**
   * Логирование успешного завершения
   */
  success(message: string): void {
    this.info(`${COLORS.green}✓${COLORS.reset} ${message}`);
  }
}

// Экспорт экземпляра логгера по умолчанию
export const logger = new Logger();

// Экспорт класса для создания кастомных логгеров
export { Logger };
