import type { SessionsStore } from './types';

type Migration = (raw: SessionsStore) => SessionsStore;

const MIGRATIONS: Record<number, Migration> = {
  // version 1 → 2 example (not yet needed):
  // 2: (store) => ({ ...store, sessions: store.sessions.map(addNewField) }),
};

export const CURRENT_SCHEMA_VERSION = 1;

export function migrate(raw: SessionsStore): SessionsStore {
  let store = raw;
  for (let v = store.schemaVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (MIGRATIONS[v]) store = MIGRATIONS[v](store);
  }
  return { ...store, schemaVersion: CURRENT_SCHEMA_VERSION };
}
