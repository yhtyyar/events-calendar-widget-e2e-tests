import { Page, BrowserContext, APIRequestContext, request } from '@playwright/test';
import { logger } from '../utils/logger';

/**
 * Централизованное хранилище тестовых данных и утилит для работы с данными.
 * Включает API-методы для авторизации и управления тестовыми данными.
 */

const log = logger.child('testData');

// ============ ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ ============

export const TEST_USERS = {
  validUser: {
    email: 'user@test.com',
    password: 'password123',
    name: 'Test User',
  },
  adminUser: {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin User',
  },
  invalidUser: {
    email: 'invalid@test.com',
    password: 'wrongpassword',
  },
  newUser: {
    email: `test_${Date.now()}@test.com`,
    password: 'newuser123',
    name: 'New Test User',
  },
} as const;

// ============ ТЕСТОВЫЕ СОБЫТИЯ ============

export const TEST_EVENTS = {
  basicEvent: {
    title: 'Test Event',
    description: 'This is a test event description',
    startDate: '2026-02-01',
    endDate: '2026-02-02',
    startTime: '10:00',
    endTime: '12:00',
    color: '#3498db',
  },
  allDayEvent: {
    title: 'All Day Event',
    description: 'Event that lasts all day',
    startDate: '2026-02-15',
    endDate: '2026-02-15',
  },
  multiDayEvent: {
    title: 'Multi Day Conference',
    description: 'A conference spanning multiple days',
    startDate: '2026-03-01',
    endDate: '2026-03-05',
    startTime: '09:00',
    endTime: '18:00',
  },
  recurringEvent: {
    title: 'Weekly Meeting',
    description: 'Recurring weekly meeting',
    startDate: '2026-02-01',
    endDate: '2026-02-01',
    startTime: '14:00',
    endTime: '15:00',
    recurring: 'weekly',
  },
  // Edge cases
  maxTitleEvent: {
    title: 'A'.repeat(255), // Максимальная длина заголовка
    startDate: '2026-02-20',
    endDate: '2026-02-20',
  },
  pastEvent: {
    title: 'Past Event',
    startDate: '2020-01-01', // Дата в прошлом
    endDate: '2020-01-01',
  },
  overlappingEvent: {
    title: 'Overlapping Event',
    startDate: '2026-02-01',
    endDate: '2026-02-03', // Пересекается с basicEvent
    startTime: '11:00',
    endTime: '13:00',
  },
} as const;

// ============ API ENDPOINTS ============

const API_ENDPOINTS = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  register: '/api/auth/register',
  events: '/api/events',
  calendar: '/api/calendar',
  sync: '/api/calendar/sync',
  user: '/api/user',
} as const;

// ============ API УТИЛИТЫ ============

/**
 * Создает API контекст для тестов
 */
export async function createAPIContext(baseURL: string): Promise<APIRequestContext> {
  return request.newContext({
    baseURL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
}

/**
 * Авторизация через API (быстрее чем через UI)
 */
export async function loginViaAPI(
  page: Page,
  context: BrowserContext,
  credentials: { email: string; password: string },
  baseURL?: string
): Promise<{ token: string; success: boolean }> {
  const url = baseURL || page.url().split('/').slice(0, 3).join('/');
  log.step(`API авторизация: ${credentials.email}`);
  
  try {
    const apiContext = await createAPIContext(url);
    
    const response = await apiContext.post(API_ENDPOINTS.login, {
      data: {
        email: credentials.email,
        password: credentials.password,
      },
    });
    
    if (!response.ok()) {
      log.warn(`API авторизация неудачна: ${response.status()}`);
      return { token: '', success: false };
    }
    
    const data = await response.json();
    const token = data.token || data.access_token || data.accessToken;
    
    if (token) {
      // Устанавливаем токен в cookies
      await context.addCookies([
        {
          name: 'auth_token',
          value: token,
          domain: new URL(url).hostname,
          path: '/',
        },
      ]);
      
      // Также устанавливаем в localStorage через page
      await page.evaluate((authToken) => {
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('isAuthenticated', 'true');
      }, token);
      
      log.success('API авторизация успешна');
      return { token, success: true };
    }
    
    return { token: '', success: false };
  } catch (error) {
    log.error('Ошибка API авторизации', error);
    return { token: '', success: false };
  }
}

/**
 * Выход через API
 */
export async function logoutViaAPI(
  page: Page,
  context: BrowserContext,
  baseURL?: string
): Promise<boolean> {
  const url = baseURL || page.url().split('/').slice(0, 3).join('/');
  
  try {
    const apiContext = await createAPIContext(url);
    await apiContext.post(API_ENDPOINTS.logout);
    
    // Очищаем cookies и localStorage
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('isAuthenticated');
    });
    
    log.success('API выход успешен');
    return true;
  } catch (error) {
    log.warn('Ошибка API выхода', error);
    return false;
  }
}

/**
 * Создание события через API
 */
export async function createEventViaAPI(
  baseURL: string,
  token: string,
  eventData: {
    title: string;
    startDate: string;
    endDate?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
  }
): Promise<{ id: string; success: boolean }> {
  try {
    const apiContext = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const response = await apiContext.post(API_ENDPOINTS.events, {
      data: eventData,
    });
    
    if (!response.ok()) {
      return { id: '', success: false };
    }
    
    const data = await response.json();
    log.success(`Событие создано через API: ${data.id}`);
    return { id: data.id, success: true };
  } catch (error) {
    log.error('Ошибка создания события через API', error);
    return { id: '', success: false };
  }
}

/**
 * Удаление события через API
 */
export async function deleteEventViaAPI(
  baseURL: string,
  token: string,
  eventId: string
): Promise<boolean> {
  try {
    const apiContext = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const response = await apiContext.delete(`${API_ENDPOINTS.events}/${eventId}`);
    
    if (response.ok()) {
      log.success(`Событие ${eventId} удалено через API`);
      return true;
    }
    
    return false;
  } catch (error) {
    log.error('Ошибка удаления события через API', error);
    return false;
  }
}

/**
 * Получение списка событий через API
 */
export async function getEventsViaAPI(
  baseURL: string,
  token: string,
  params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<{ events: unknown[]; success: boolean }> {
  try {
    const apiContext = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.events}?${queryParams}` 
      : API_ENDPOINTS.events;
    
    const response = await apiContext.get(url);
    
    if (!response.ok()) {
      return { events: [], success: false };
    }
    
    const data = await response.json();
    return { events: data.events || data || [], success: true };
  } catch (error) {
    log.error('Ошибка получения событий через API', error);
    return { events: [], success: false };
  }
}

// ============ ГЕНЕРАТОРЫ ТЕСТОВЫХ ДАННЫХ ============

/**
 * Генерирует уникальное название события
 */
export function generateEventTitle(prefix = 'Test Event'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix} ${timestamp}_${random}`;
}

/**
 * Генерирует дату в формате YYYY-MM-DD
 */
export function generateDate(daysFromNow = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Генерирует время в формате HH:MM
 */
export function generateTime(hoursFromNow = 0): string {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Интерфейс данных события для генерации
 */
export interface GeneratedEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  color?: string;
}

/**
 * Генерирует полные тестовые данные события
 */
export function generateEventData(overrides: Partial<GeneratedEventData> = {}): GeneratedEventData {
  return {
    title: generateEventTitle(),
    description: 'Auto-generated test event',
    startDate: generateDate(1),
    endDate: generateDate(1),
    startTime: '10:00',
    endTime: '12:00',
    color: '#3498db',
    ...overrides,
  };
}

/**
 * Генерирует email для нового пользователя
 */
export function generateEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `test_${timestamp}_${random}@test.com`;
}

// ============ МОКИ ДЛЯ СЕТИ ============

/**
 * Настраивает мок для имитации отсутствия сети
 */
export async function mockNetworkOffline(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    route.abort('internetdisconnected');
  });
  log.step('Сеть отключена (мок)');
}

/**
 * Настраивает мок для медленной сети
 */
export async function mockSlowNetwork(page: Page, delayMs = 2000): Promise<void> {
  await page.route('**/*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
  log.step(`Медленная сеть (${delayMs}ms задержка)`);
}

/**
 * Настраивает мок для ошибки сервера
 */
export async function mockServerError(
  page: Page,
  urlPattern: string,
  statusCode = 500
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });
  log.step(`Мок ошибки сервера ${statusCode} для ${urlPattern}`);
}

/**
 * Отключает все моки сети
 */
export async function clearNetworkMocks(page: Page): Promise<void> {
  await page.unrouteAll();
  log.step('Моки сети очищены');
}

// ============ ОЧИСТКА ТЕСТОВЫХ ДАННЫХ ============

/**
 * Очищает все тестовые события пользователя
 */
export async function cleanupTestEvents(
  baseURL: string,
  token: string,
  titlePrefix = 'Test'
): Promise<number> {
  const { events, success } = await getEventsViaAPI(baseURL, token);
  
  if (!success) {
    log.warn('Не удалось получить список событий для очистки');
    return 0;
  }
  
  let deletedCount = 0;
  
  for (const event of events as { id: string; title: string }[]) {
    if (event.title?.startsWith(titlePrefix)) {
      const deleted = await deleteEventViaAPI(baseURL, token, event.id);
      if (deleted) deletedCount++;
    }
  }
  
  log.success(`Удалено ${deletedCount} тестовых событий`);
  return deletedCount;
}
