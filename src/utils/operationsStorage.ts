import { Vendor, RecurringService, Task, QuickCaptureItem } from '../types';
import { idbGet, idbSet, safeGetLocalStorage, safeSetLocalStorage } from './storage';
import { initialVendorsSeed, initialRecurringServicesSeed } from '../data/operationsSeedData';

const VENDORS_KEY = 'ptl_vendors_archive';
const RECURRING_KEY = 'ptl_recurring_archive';
const TASKS_KEY = 'ptl_tasks_archive';
const QUICK_CAPTURES_KEY = 'ptl_quick_captures_archive';
const HAS_INITIALIZED_KEY = 'ptl_operations_initialized_v2';

/**
 * Load Vendors with dual persistence (IndexedDB -> LocalStorage).
 * Respects empty arrays [] when the owner has no records.
 */
export async function loadVendors(): Promise<Vendor[]> {
  try {
    const idbData = await idbGet<Vendor[]>(VENDORS_KEY);
    if (Array.isArray(idbData)) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(VENDORS_KEY);
    if (lsData !== null) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed)) {
        idbSet(VENDORS_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[operationsStorage] Error loading vendors:', err);
  }

  // Check if ever initialized. In production, initial state allows empty []
  const isInit = safeGetLocalStorage(HAS_INITIALIZED_KEY);
  if (isInit) {
    return [];
  }
  safeSetLocalStorage(HAS_INITIALIZED_KEY, 'true');
  await saveVendors([]);
  return [];
}

export async function saveVendors(vendors: Vendor[]): Promise<void> {
  if (!Array.isArray(vendors)) return;
  try {
    await idbSet(VENDORS_KEY, vendors);
    safeSetLocalStorage(VENDORS_KEY, JSON.stringify(vendors));
  } catch (err) {
    console.warn('[operationsStorage] Error saving vendors:', err);
  }
}

/**
 * Load Recurring Services with dual persistence.
 * Respects empty arrays [] without automatically loading demo records.
 */
export async function loadRecurringServices(): Promise<RecurringService[]> {
  try {
    const idbData = await idbGet<RecurringService[]>(RECURRING_KEY);
    if (Array.isArray(idbData)) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(RECURRING_KEY);
    if (lsData !== null) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed)) {
        idbSet(RECURRING_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[operationsStorage] Error loading recurring services:', err);
  }

  const isInit = safeGetLocalStorage(HAS_INITIALIZED_KEY);
  if (isInit) {
    return [];
  }
  safeSetLocalStorage(HAS_INITIALIZED_KEY, 'true');
  await saveRecurringServices([]);
  return [];
}

export async function saveRecurringServices(services: RecurringService[]): Promise<void> {
  if (!Array.isArray(services)) return;
  try {
    await idbSet(RECURRING_KEY, services);
    safeSetLocalStorage(RECURRING_KEY, JSON.stringify(services));
  } catch (err) {
    console.warn('[operationsStorage] Error saving recurring services:', err);
  }
}

/**
 * Load Tasks with dual persistence
 */
export async function loadTasks(): Promise<Task[]> {
  try {
    const idbData = await idbGet<Task[]>(TASKS_KEY);
    if (Array.isArray(idbData)) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(TASKS_KEY);
    if (lsData !== null) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed)) {
        idbSet(TASKS_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[operationsStorage] Error loading tasks:', err);
  }

  return [];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  if (!Array.isArray(tasks)) return;
  try {
    await idbSet(TASKS_KEY, tasks);
    safeSetLocalStorage(TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('[operationsStorage] Error saving tasks:', err);
  }
}

/**
 * Quick Captures storage for fast note-taking in My Day
 */
export async function loadQuickCaptures(): Promise<QuickCaptureItem[]> {
  try {
    const idbData = await idbGet<QuickCaptureItem[]>(QUICK_CAPTURES_KEY);
    if (Array.isArray(idbData)) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(QUICK_CAPTURES_KEY);
    if (lsData !== null) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed)) {
        idbSet(QUICK_CAPTURES_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[operationsStorage] Error loading quick captures:', err);
  }
  return [];
}

export async function saveQuickCaptures(captures: QuickCaptureItem[]): Promise<void> {
  if (!Array.isArray(captures)) return;
  try {
    await idbSet(QUICK_CAPTURES_KEY, captures);
    safeSetLocalStorage(QUICK_CAPTURES_KEY, JSON.stringify(captures));
  } catch (err) {
    console.warn('[operationsStorage] Error saving quick captures:', err);
  }
}

/**
 * Optional Manual Demo Seed Loader (Available for explicit dev/testing, but never auto-loaded)
 */
export async function loadManualDemoOperations(): Promise<{
  vendors: Vendor[];
  recurringServices: RecurringService[];
}> {
  await saveVendors(initialVendorsSeed);
  await saveRecurringServices(initialRecurringServicesSeed);
  return {
    vendors: initialVendorsSeed,
    recurringServices: initialRecurringServicesSeed,
  };
}
