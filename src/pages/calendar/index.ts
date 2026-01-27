/**
 * Calendar module exports
 * Provides decomposed Page Object architecture:
 * - CalendarPage: UI locators and basic interactions
 * - CalendarActions: Business logic (create, edit, delete events)
 * - CalendarAssertions: Validation and assertions
 */

export { CalendarPage } from './CalendarPage';
export { CalendarActions, type EventData } from './CalendarActions';
export { CalendarAssertions } from './CalendarAssertions';
