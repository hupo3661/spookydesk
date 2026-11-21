import type { StreakStore } from './types';

export const CURRENT_STREAK_SCHEMA_VERSION = 1;

type Migration = (raw: StreakStore) => StreakStore;
const MIGRATIONS: Record<number, Migration> = {};

export function migrateStreakStore(raw: StreakStore): StreakStore {
  let store = raw;
  for (let v = store.schemaVersion + 1; v <= CURRENT_STREAK_SCHEMA_VERSION; v++) {
    if (MIGRATIONS[v]) store = MIGRATIONS[v](store);
  }
  return { ...store, schemaVersion: CURRENT_STREAK_SCHEMA_VERSION };
}
