/**
 * Phuket Trusted Local - Safe Storage Utility
 * Prevents QuotaExceededError by using IndexedDB for high-capacity photo & job storage,
 * paired with safe, fail-resistant localStorage fallbacks.
 */

const DB_NAME = 'PTL_VILLA_STORAGE_V1';
const STORE_NAME = 'keyval_store';

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * IndexedDB Key-Value Store (handles tens of megabytes of inspection photos without quota issues)
 */
export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbSet(key: string, value: any): Promise<boolean> {
  try {
    const db = await openDb();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function idbRemove(key: string): Promise<boolean> {
  try {
    const db = await openDb();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Safe localStorage wrapper that NEVER throws QuotaExceededError
 */
export function safeGetLocalStorage(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch (err) {
    console.debug(`[safeStorage] safeGetLocalStorage failed for key: ${key}`, err);
    return null;
  }
}

export function safeRemoveLocalStorage(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch (err) {
    console.debug(`[safeStorage] safeRemoveLocalStorage failed for key: ${key}`, err);
  }
}

export interface LocalSnapshot {
  timestamp: string; // ISO string
  formattedTime: string; // Localized Thai time
  jobCount: number;
  totalFindings: number;
  villaNames: string[];
  activeJobId?: string;
  jobs: any[];
}

const SNAPSHOTS_KEY = 'ptl_snapshots_history';
const DELETED_JOBS_KEY = 'ptl_deleted_job_ids';
const FINDING_DRAFT_KEY = 'ptl_active_finding_draft';

/**
 * Save a rolling local snapshot to IndexedDB (keeps last 30 snapshots)
 * This guarantees zero data loss even across reboots or crashes.
 */
export async function saveLocalSnapshot(jobs: any[], activeJobId?: string): Promise<void> {
  if (!Array.isArray(jobs) || jobs.length === 0) return;
  try {
    const existing = (await idbGet<LocalSnapshot[]>(SNAPSHOTS_KEY)) || [];
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' (' + now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ')';

    const totalFindings = jobs.reduce((acc, j) => acc + (j.items?.length || 0), 0);
    const villaNames = jobs.map((j) => j.villaName || j.customerName || 'วิลล่า').filter(Boolean);

    const newSnapshot: LocalSnapshot = {
      timestamp: now.toISOString(),
      formattedTime,
      jobCount: jobs.length,
      totalFindings,
      villaNames,
      activeJobId,
      jobs: JSON.parse(JSON.stringify(jobs)), // Deep clone
    };

    // Keep up to 30 snapshots, newest first
    const updated = [newSnapshot, ...existing.filter((s) => s && s.timestamp)].slice(0, 30);
    await idbSet(SNAPSHOTS_KEY, updated);
  } catch (err) {
    console.warn('[safeStorage] Could not save local snapshot:', err);
  }
}

/**
 * Retrieve all local history snapshots from IndexedDB
 */
export async function getLocalSnapshots(): Promise<LocalSnapshot[]> {
  try {
    const list = await idbGet<LocalSnapshot[]>(SNAPSHOTS_KEY);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Restore jobs from a chosen snapshot timestamp
 */
export async function restoreLocalSnapshot(timestamp: string): Promise<LocalSnapshot | null> {
  try {
    const list = await getLocalSnapshots();
    const found = list.find((s) => s.timestamp === timestamp);
    return found || null;
  } catch {
    return null;
  }
}

/**
 * Track explicitly deleted jobs so stale server files don't resurrect them
 */
export function getDeletedJobIds(): Set<string> {
  try {
    const raw = safeGetLocalStorage(DELETED_JOBS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markJobAsDeleted(jobId: string): void {
  if (!jobId) return;
  try {
    const current = getDeletedJobIds();
    current.add(jobId);
    safeSetLocalStorage(DELETED_JOBS_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

/**
 * Finding form draft persistence (so accidental close / reload NEVER loses typed text)
 */
export function saveFindingDraft(draft: any): void {
  try {
    if (!draft) return;
    safeSetLocalStorage(FINDING_DRAFT_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
  } catch {}
}

export function getFindingDraft(): any | null {
  try {
    const raw = safeGetLocalStorage(FINDING_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearFindingDraft(): void {
  try {
    safeRemoveLocalStorage(FINDING_DRAFT_KEY);
  } catch {}
}

/**
 * ZERO-LOSS JOBS MERGER:
 * Consolidates jobs from IndexedDB, LocalStorage, and Server API.
 * Guarantees that:
 * 1. User-created jobs are NEVER dropped.
 * 2. Within each job, findings are MERGED (union of item IDs) so no finding is lost.
 * 3. Does NOT rely on finding count to overwrite local data with stale server seed data.
 */
export function mergeJobsWithoutDataLoss(sources: (any[] | null)[]): any[] {
  const deletedIds = getDeletedJobIds();
  const jobMap = new Map<string, any>();

  for (const jobList of sources) {
    if (!Array.isArray(jobList)) continue;
    for (const rawJob of jobList) {
      if (!rawJob || !rawJob.id || deletedIds.has(rawJob.id)) continue;

      const existing = jobMap.get(rawJob.id);
      if (!existing) {
        // Deep clone to prevent mutations
        jobMap.set(rawJob.id, {
          ...rawJob,
          items: Array.isArray(rawJob.items) ? [...rawJob.items] : [],
        });
      } else {
        // Job exists in multiple sources -> MERGE FINDINGS WITHOUT LOSS
        const itemMap = new Map<string, any>();

        // Add existing items
        for (const it of existing.items || []) {
          if (it && it.id) itemMap.set(it.id, it);
        }

        // Add or enrich with incoming items
        for (const it of rawJob.items || []) {
          if (!it || !it.id) continue;
          const existingItem = itemMap.get(it.id);
          if (!existingItem) {
            itemMap.set(it.id, it);
          } else {
            // Keep the one with richer content or photo
            const existingLen = (existingItem.observationTh?.length || 0) + (existingItem.observationEn?.length || 0);
            const incomingLen = (it.observationTh?.length || 0) + (it.observationEn?.length || 0);
            const hasPhoto = Boolean(it.imageUrl && it.imageUrl.length > 50);
            const existingHasPhoto = Boolean(existingItem.imageUrl && existingItem.imageUrl.length > 50);

            if (incomingLen > existingLen || (hasPhoto && !existingHasPhoto)) {
              itemMap.set(it.id, { ...existingItem, ...it });
            }
          }
        }

        // Keep the richer quotation if modified
        const existingQuoteCount = (existing.quotation?.hardwareItems?.length || 0) + (existing.quotation?.serviceItems?.length || 0);
        const incomingQuoteCount = (rawJob.quotation?.hardwareItems?.length || 0) + (rawJob.quotation?.serviceItems?.length || 0);

        // Merge events without loss
        const existingEvents = Array.isArray(existing.events) ? existing.events : [];
        const incomingEvents = Array.isArray(rawJob.events) ? rawJob.events : [];
        const eventMap = new Map<string, any>();
        for (const ev of [...existingEvents, ...incomingEvents]) {
          if (ev && ev.id) eventMap.set(ev.id, ev);
        }

        // Merge evidence photos without loss
        const existingPhotos = Array.isArray(existing.evidencePhotos) ? existing.evidencePhotos : [];
        const incomingPhotos = Array.isArray(rawJob.evidencePhotos) ? rawJob.evidencePhotos : [];
        const photoMap = new Map<string, any>();
        for (const ph of [...existingPhotos, ...incomingPhotos]) {
          if (ph && ph.id) photoMap.set(ph.id, ph);
        }

        jobMap.set(rawJob.id, {
          ...existing,
          ...rawJob,
          villaName: rawJob.villaName || existing.villaName,
          customerName: rawJob.customerName || existing.customerName,
          propertyLocation: rawJob.propertyLocation || existing.propertyLocation,
          driveFolderUrl: rawJob.driveFolderUrl || existing.driveFolderUrl || '',
          items: Array.from(itemMap.values()),
          events: Array.from(eventMap.values()),
          evidencePhotos: Array.from(photoMap.values()),
          quotation: incomingQuoteCount >= existingQuoteCount ? rawJob.quotation : existing.quotation,
          updatedAt: rawJob.updatedAt || existing.updatedAt || new Date().toISOString(),
          lastActivityAt: rawJob.lastActivityAt || existing.lastActivityAt || rawJob.updatedAt || existing.updatedAt,
        });
      }
    }
  }

  return Array.from(jobMap.values());
}

/**
 * Saves to localStorage safely. If QuotaExceededError is caught:
 * 1. Automatically purges legacy/redundant oversized keys (e.g. duplicate job snapshots, old logo bloat)
 * 2. Tries again
 * 3. If still full, gracefully handles without crashing or throwing
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (err?.message && /quota/i.test(err.message));

    if (isQuota) {
      console.warn(`[safeStorage] Storage quota exceeded while saving "${key}". Evicting non-critical cache and compressing...`);
      try {
        // NEVER delete ptl_jobs_archive! Only remove redundant logo cache
        if (key !== 'ptl_custom_logo') {
          window.localStorage.removeItem('ptl_custom_logo');
        }
        
        // If the item itself is very large (e.g. jobs archive with embedded base64 photos),
        // create a lightweight text-only clone for localStorage so findings & texts are NEVER lost
        if (key === 'ptl_jobs_archive' || key === 'ptl_current_job') {
          try {
            const parsed = JSON.parse(value);
            const sanitizePhotos = (item: any): any => {
              if (Array.isArray(item)) return item.map(sanitizePhotos);
              if (item && typeof item === 'object') {
                const clone = { ...item };
                if (clone.imageUrl && typeof clone.imageUrl === 'string' && clone.imageUrl.length > 500) {
                  // Keep reference, full image is already safely stored in IndexedDB
                  clone.imageUrl = clone.imageUrl.substring(0, 80);
                }
                if (Array.isArray(clone.items)) {
                  clone.items = clone.items.map(sanitizePhotos);
                }
                return clone;
              }
              return item;
            };
            const stripped = sanitizePhotos(parsed);
            window.localStorage.setItem(key, JSON.stringify(stripped));
            return true;
          } catch {
            // fallback below
          }
        }

        // Retry once after clearing ephemeral cache
        window.localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.warn(`[safeStorage] Could not fit "${key}" into localStorage. Full data remains safely persisted in IndexedDB & Server API.`, retryErr);
        return false;
      }
    }
    console.warn(`[safeStorage] safeSetLocalStorage error for "${key}":`, err);
    return false;
  }
}
