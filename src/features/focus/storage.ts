import { migrate } from './migrations';
import type { SessionRecord, SessionsStore } from './types';

const SESSIONS_KEY = 'spookydesk.sessions';

function emptyStore(): SessionsStore {
  return { schemaVersion: 1, sessions: [] };
}

/** Load and migrate store from localStorage; returns empty store if absent/corrupt. */
export function loadSessionsStore(): SessionsStore {
  try {
    const json = localStorage.getItem(SESSIONS_KEY);
    if (json === null) return emptyStore();
    const parsed: unknown = JSON.parse(json);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as SessionsStore).sessions)
    ) {
      throw new Error('Invalid sessions store shape');
    }
    return migrate(parsed as SessionsStore);
  } catch (err) {
    console.warn('spookydesk: failed to load sessions store, using empty', err);
    return emptyStore();
  }
}

/** Persist the full store. Never throws. */
export function saveSessionsStore(store: SessionsStore): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('spookydesk: failed to save sessions store', err);
  }
}

/** Append one session record. */
export function appendSession(record: SessionRecord): void {
  const store = loadSessionsStore();
  store.sessions.push(record);
  saveSessionsStore(store);
}

/** Called by the stats feature to aggregate data. */
export function getAllSessions(): SessionRecord[] {
  return loadSessionsStore().sessions;
}

export function getSessionsForTask(taskId: string): SessionRecord[] {
  return loadSessionsStore().sessions.filter((s) => s.taskId === taskId);
}
