import type { ECCloud, ArrowId, ECAssumption, ECInjection } from '../types/ec.ts';

const STORAGE_KEY = 'ec-builder-cloud';
const TIMESTAMP_KEY = 'ec-builder-last-saved';

const VALID_ARROW_IDS: ArrowId[] = ['A-B', 'A-C', 'B-D', 'C-Dp', 'D-Dp'];

export function saveToLocalStorage(cloud: ECCloud): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud));
    localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadFromLocalStorage(): ECCloud | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!validateECCloud(parsed)) return null;
    return { ...parsed, schemaVersion: 1 } as ECCloud;
  } catch {
    return null;
  }
}

export function getLastSavedTimestamp(): string | null {
  return localStorage.getItem(TIMESTAMP_KEY);
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TIMESTAMP_KEY);
}

export type SchemaCheckResult =
  | { ok: true; version: 1 }
  | { ok: false; error: string };

/**
 * Validates the schemaVersion field. Missing → treated as v1 (back-compat for
 * pre-versioning user data). Present and 1 → accepted. Anything else → rejected.
 */
export function checkSchemaVersion(obj: unknown): SchemaCheckResult {
  if (!obj || typeof obj !== 'object') {
    return { ok: false, error: 'Not a valid object.' };
  }
  const t = obj as Record<string, unknown>;
  if (t.schemaVersion === undefined) return { ok: true, version: 1 };
  if (typeof t.schemaVersion !== 'number') {
    return { ok: false, error: 'schemaVersion must be a number.' };
  }
  if (t.schemaVersion > 1) {
    return {
      ok: false,
      error: 'This file was created with a newer version of the tool. Please update.',
    };
  }
  if (t.schemaVersion < 1) {
    return { ok: false, error: 'schemaVersion must be >= 1.' };
  }
  return { ok: true, version: 1 };
}

/**
 * Structural validation for ECCloud objects.
 * Strict enough to catch corrupted/wrong files, lenient on content (empty strings ok).
 */
export function validateECCloud(obj: unknown): obj is ECCloud {
  if (!obj || typeof obj !== 'object') return false;
  const c = obj as Record<string, unknown>;

  const schema = checkSchemaVersion(obj);
  if (!schema.ok) return false;

  // Required top-level string fields
  if (typeof c.id !== 'string') return false;
  if (typeof c.objective !== 'string') return false;
  if (typeof c.requirementB !== 'string') return false;
  if (typeof c.requirementC !== 'string') return false;
  if (typeof c.prerequisiteD !== 'string') return false;
  if (typeof c.prerequisiteDPrime !== 'string') return false;

  // Conflict object
  if (!c.conflict || typeof c.conflict !== 'object') return false;
  const conflict = c.conflict as Record<string, unknown>;
  if (typeof conflict.description !== 'string') return false;

  // Assumptions array
  if (!Array.isArray(c.assumptions)) return false;
  for (const a of c.assumptions) {
    if (!validateAssumption(a)) return false;
  }

  // Injections array
  if (!Array.isArray(c.injections)) return false;
  for (const inj of c.injections) {
    if (!validateInjection(inj)) return false;
  }

  return true;
}

function validateAssumption(obj: unknown): obj is ECAssumption {
  if (!obj || typeof obj !== 'object') return false;
  const a = obj as Record<string, unknown>;
  if (typeof a.id !== 'string') return false;
  if (typeof a.arrowId !== 'string') return false;
  if (!VALID_ARROW_IDS.includes(a.arrowId as ArrowId)) return false;
  if (typeof a.text !== 'string') return false;
  return true;
}

function validateInjection(obj: unknown): obj is ECInjection {
  if (!obj || typeof obj !== 'object') return false;
  const inj = obj as Record<string, unknown>;
  if (typeof inj.id !== 'string') return false;
  if (typeof inj.targetAssumptionId !== 'string') return false;
  if (typeof inj.text !== 'string') return false;
  return true;
}

/**
 * Creates a debounced version of a function.
 * Returns [debouncedFn, cancelFn].
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number
): [(...args: Parameters<T>) => void, () => void] {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
  const cancel = () => {
    if (timer) clearTimeout(timer);
  };
  return [debounced, cancel];
}
