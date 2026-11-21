import { isYesterday } from './dateUtils';
import { migrateStreakStore } from './streakMigrations';
import type { StreakStore } from './types';

export const STREAK_KEY = 'spookydesk.streak';

const DEFAULT_STREAK: StreakStore = {
  schemaVersion: 1,
  lastActiveDate: null,
  currentStreak: 0,
  longestStreak: 0,
};

/** Load and migrate the streak store; returns the default if absent/corrupt. */
export function loadStreakStore(): StreakStore {
  try {
    const json = localStorage.getItem(STREAK_KEY);
    if (json === null) return { ...DEFAULT_STREAK };
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid streak store shape');
    }
    return migrateStreakStore(parsed as StreakStore);
  } catch (err) {
    console.warn('spookydesk: failed to load streak store, using default', err);
    return { ...DEFAULT_STREAK };
  }
}

/** Persist the streak store. Never throws. */
export function saveStreakStore(store: StreakStore): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('spookydesk: failed to save streak store', err);
  }
}

/**
 * Core streak update. Reads the current store, applies rules, saves.
 * today is a local YYYY-MM-DD string. Returns the updated store.
 */
export function updateStreak(today: string): StreakStore {
  const store = loadStreakStore();
  const { lastActiveDate, currentStreak, longestStreak } = store;

  if (lastActiveDate === today) {
    return store;
  }

  let next: number;
  if (lastActiveDate !== null && isYesterday(lastActiveDate, today)) {
    next = currentStreak + 1;
  } else {
    next = 1;
  }

  const updated: StreakStore = {
    ...store,
    lastActiveDate: today,
    currentStreak: next,
    longestStreak: Math.max(longestStreak, next),
  };
  saveStreakStore(updated);
  return updated;
}
