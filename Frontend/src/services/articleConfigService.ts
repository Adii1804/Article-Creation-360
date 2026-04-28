/**
 * articleConfigService.ts
 *
 * Fetches SAP field configs and attribute values from the backend DB.
 * Caches results in memory so synchronous callers (getMajCatAllowedValues) work
 * after an initial async preload.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({ baseURL: `${API_BASE_URL}/article-config` });

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SapFieldConfig {
  id: number;
  section: string;
  uiLabel: string;
  dbField: string;
  sapField: string;
  displayOrder: number;
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

// values cache: majorCategory → { dbField → string[] }
const valuesCache = new Map<string, Record<string, string[]>>();
let fieldsCache: SapFieldConfig[] | null = null;
const pendingLoads = new Map<string, Promise<void>>();

// ─── Public API ───────────────────────────────────────────────────────────────

/** Preload field configs (call once at app startup or component mount). */
export async function preloadFieldConfigs(): Promise<SapFieldConfig[]> {
  if (fieldsCache) return fieldsCache;
  const { data } = await api.get<{ data: SapFieldConfig[] }>('/fields');
  fieldsCache = data.data;
  return fieldsCache;
}

/**
 * Preload allowed values for a major category.
 * Safe to call multiple times — deduplicates in-flight requests.
 */
export async function preloadAttributeValues(majorCategory: string): Promise<void> {
  if (valuesCache.has(majorCategory)) return;
  if (pendingLoads.has(majorCategory)) return pendingLoads.get(majorCategory)!;

  const load = api
    .get<{ data: Record<string, string[]> }>(`/values?majorCategory=${encodeURIComponent(majorCategory)}`)
    .then(({ data }) => {
      valuesCache.set(majorCategory, data.data);
    })
    .finally(() => pendingLoads.delete(majorCategory));

  pendingLoads.set(majorCategory, load);
  return load;
}

/**
 * Synchronous lookup — returns values from cache.
 * Must call preloadAttributeValues(majorCategory) first.
 */
export function getCachedValues(
  majorCategory: string,
  dbField: string
): string[] | null {
  const catData = valuesCache.get(majorCategory);
  if (!catData) return null;
  return catData[dbField] ?? null;
}

/** Returns true if values for this major category are already cached. */
export function isValuesCached(majorCategory: string): boolean {
  return valuesCache.has(majorCategory);
}

/** Returns the cached field configs (null if not yet loaded). */
export function getCachedFieldConfigs(): SapFieldConfig[] | null {
  return fieldsCache;
}

/** Build a dbField → sapField lookup from the cached field configs. */
export function buildDbToSapMap(): Record<string, string> {
  if (!fieldsCache) return {};
  return Object.fromEntries(fieldsCache.map((f) => [f.dbField, f.sapField]));
}

/** Build a uiLabel → dbField lookup from the cached field configs. */
export function buildUiLabelToDbFieldMap(): Record<string, string> {
  if (!fieldsCache) return {};
  return Object.fromEntries(fieldsCache.map((f) => [f.uiLabel, f.dbField]));
}
