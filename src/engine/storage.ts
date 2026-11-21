import {
  COSTUME_REGISTRY,
  DEFAULT_COSTUME_ID,
  type CostumeId,
} from '../costumes/registry';

const SETTINGS_KEY = 'spookydesk.settings';

type SettingsObject = Record<string, unknown>;

function isCostumeId(value: unknown): value is CostumeId {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(COSTUME_REGISTRY, value)
  );
}

/** Reads the settings object; returns null when missing, unparsable or not a plain object. */
function readSettings(): SettingsObject | null {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as SettingsObject;
  } catch {
    return null;
  }
}

/** Returns the persisted costume id, or DEFAULT_COSTUME_ID on any failure. */
export function getCostumeId(): CostumeId {
  const id = readSettings()?.costumeId;
  return isCostumeId(id) ? id : DEFAULT_COSTUME_ID;
}

/** Persists the costume id, preserving all other settings fields. Never throws. */
export function setCostumeId(id: CostumeId): void {
  try {
    const next: SettingsObject = { ...(readSettings() ?? {}), costumeId: id };
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable or full: persistence is best-effort.
  }
}

/** Returns the value stored under `key` in the settings object, or undefined. */
export function getSetting(key: string): unknown {
  const settings = readSettings();
  if (settings === null) return undefined;
  return Object.prototype.hasOwnProperty.call(settings, key)
    ? settings[key]
    : undefined;
}

/** Merges `key: value` into the settings object, preserving other fields. Never throws. */
export function setSetting(key: string, value: unknown): void {
  try {
    const next: SettingsObject = { ...(readSettings() ?? {}), [key]: value };
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable or full: persistence is best-effort.
  }
}
