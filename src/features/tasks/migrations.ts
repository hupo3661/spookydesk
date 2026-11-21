import type { TasksStore } from './storage';

type Migration = (raw: TasksStore) => TasksStore;

const MIGRATIONS: Record<number, Migration> = {
  // version 1 → 2 example (not yet needed):
  // 2: (store) => ({ ...store, tasks: store.tasks.map(addNewField) }),
};

export const CURRENT_SCHEMA_VERSION = 1;

export function migrate(raw: TasksStore): TasksStore {
  let store = raw;
  for (let v = store.schemaVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (MIGRATIONS[v]) store = MIGRATIONS[v](store);
  }
  return { ...store, schemaVersion: CURRENT_SCHEMA_VERSION };
}
