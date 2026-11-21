import { CURRENT_SCHEMA_VERSION, migrate } from './migrations';
import type { Task } from './types';

export interface TasksStore {
  schemaVersion: number;
  tasks: Task[];
  /** Lifetime count; never decremented. */
  monstersDefeated: number;
}

const STORAGE_KEY = 'spookydesk.tasks';

const DEFAULT_STORE: TasksStore = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  tasks: [],
  monstersDefeated: 0,
};

function defaultStore(): TasksStore {
  return { ...DEFAULT_STORE, tasks: [] };
}

/** Load and migrate store from localStorage; returns default if absent/corrupt. */
export function loadTasksStore(): TasksStore {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (json === null) return defaultStore();
    const parsed: unknown = JSON.parse(json);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as TasksStore).schemaVersion !== 'number' ||
      !Array.isArray((parsed as TasksStore).tasks) ||
      typeof (parsed as TasksStore).monstersDefeated !== 'number'
    ) {
      throw new Error('Invalid tasks store shape');
    }
    return migrate(parsed as TasksStore);
  } catch (err) {
    console.warn('spookydesk: failed to load tasks store, using default', err);
    return defaultStore();
  }
}

/** Persist the full store. Synchronous. */
export function saveTasksStore(store: TasksStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('spookydesk: failed to save tasks store', err);
  }
}

/** Convenience read of a single task by id. */
export function getTask(id: string): Task | undefined {
  return loadTasksStore().tasks.find((t) => t.id === id);
}

/** Create or replace a task; returns the updated store. */
export function putTask(task: Task): TasksStore {
  const store = loadTasksStore();
  const exists = store.tasks.some((t) => t.id === task.id);
  const next: TasksStore = {
    ...store,
    tasks: exists
      ? store.tasks.map((t) => (t.id === task.id ? task : t))
      : [...store.tasks, task],
  };
  saveTasksStore(next);
  return next;
}

/** Delete a task; returns the updated store. */
export function removeTask(id: string): TasksStore {
  const store = loadTasksStore();
  const next: TasksStore = {
    ...store,
    tasks: store.tasks.filter((t) => t.id !== id),
  };
  saveTasksStore(next);
  return next;
}

function setLink(taskId: string, sessionId: string | null): void {
  const store = loadTasksStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return;
  saveTasksStore({
    ...store,
    tasks: store.tasks.map((t) =>
      t.id === taskId
        ? { ...t, linkedSessionId: sessionId, updatedAt: new Date().toISOString() }
        : t,
    ),
  });
}

/** Set the focus-session link on a task. Called by the timer feature. */
export function linkSession(taskId: string, sessionId: string): void {
  setLink(taskId, sessionId);
}

/** Clear the focus-session link on a task. Called by the timer feature. */
export function unlinkSession(taskId: string): void {
  setLink(taskId, null);
}

/** Read the lifetime counter. Called by the stats feature. */
export function getMonstersDefeated(): number {
  return loadTasksStore().monstersDefeated;
}

/** Increment the counter by 1. Called only by task completion logic. */
export function incrementMonstersDefeated(): void {
  const store = loadTasksStore();
  saveTasksStore({ ...store, monstersDefeated: store.monstersDefeated + 1 });
}
