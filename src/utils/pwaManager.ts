// PTL V2 Client-Side PWA & Service Worker Manager
import { BUILD_VERSION, CURRENT_CACHE_NAME } from './buildVersion';

export interface PWAUpdateCallbacks {
  onUpdateAvailable: (newVersion?: string) => void;
  onActivated?: () => void;
}

let registrationInstance: ServiceWorkerRegistration | null = null;
let waitingWorkerInstance: ServiceWorker | null = null;

/**
 * Clean up obsolete browser CacheStorage entries safely.
 * CRITICAL: NEVER touches localStorage or IndexedDB.
 */
export async function cleanObsoleteCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const keys = await window.caches.keys();
    const obsolete = keys.filter(
      (key) =>
        (key.startsWith('ptl-') && key !== CURRENT_CACHE_NAME) ||
        key.startsWith('workbox-') ||
        key.startsWith('vite-')
    );
    await Promise.all(
      obsolete.map((key) => {
        console.log('[PTL PWA] Purging obsolete cache:', key);
        return window.caches.delete(key);
      })
    );
  } catch (err) {
    console.warn('[PTL PWA] Cache purge notice:', err);
  }
}

/**
 * Register Service Worker and attach update listeners
 */
export function initPWAUpdateManager(callbacks: PWAUpdateCallbacks): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Purge any old caches on launch
  cleanObsoleteCaches();

  window.addEventListener('load', async () => {
    try {
      // 1. Unregister any rogue / foreign service workers with different scopes
      const existingRegs = await navigator.serviceWorker.getRegistrations();
      for (const reg of existingRegs) {
        if (!reg.active?.scriptURL.endsWith('/sw.js')) {
          console.log('[PTL PWA] Unregistering legacy worker:', reg.active?.scriptURL);
          await reg.unregister();
        }
      }

      // 2. Register current sw.js with updateViaCache: 'none'
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      registrationInstance = registration;

      // Check if there is already a waiting worker
      if (registration.waiting) {
        waitingWorkerInstance = registration.waiting;
        callbacks.onUpdateAvailable();
      }

      // 3. Listen for future updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (
            installingWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New version installed in background and waiting!
            waitingWorkerInstance = installingWorker;
            callbacks.onUpdateAvailable();
          }
        });
      });

      // 4. Check for updates on visibility regain (e.g. user unlocks mobile phone or returns to app)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
          checkServerVersion(callbacks.onUpdateAvailable);
        }
      });

      // 5. Initial server version check
      checkServerVersion(callbacks.onUpdateAvailable);
    } catch (err) {
      console.warn('[PTL PWA] Service Worker registration notice:', err);
    }
  });

  // Reload when new service worker takes over (if initiated by user)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

/**
 * Check if the server is reporting a newer build version
 */
export async function checkServerVersion(onUpdateAvailable: (version?: string) => void): Promise<void> {
  try {
    const res = await fetch(`/api/version?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version && data.version !== BUILD_VERSION) {
        console.log(`[PTL PWA] Server version (${data.version}) != Client (${BUILD_VERSION})`);
        onUpdateAvailable(data.version);
      }
    }
  } catch (_e) {
    // Network unavailable or offline, ignore
  }
}

/**
 * Force manual update application (called when user clicks 'Update Now')
 */
export async function applyPWAUpdate(): Promise<void> {
  try {
    // Send message to waiting worker
    if (waitingWorkerInstance) {
      waitingWorkerInstance.postMessage({ type: 'SKIP_WAITING' });
    } else if (registrationInstance?.waiting) {
      registrationInstance.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Clean caches
    await cleanObsoleteCaches();
  } catch (e) {
    console.warn('[PTL PWA] Update apply notice:', e);
  } finally {
    // Reload safely
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }
}

/**
 * Completely clean all application CacheStorage and reload.
 * Guaranteed to NOT delete IndexedDB (all jobs, photos, and quotes remain safe).
 */
export async function clearAppCachesAndReload(): Promise<void> {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((k) => window.caches.delete(k)));
    } catch (e) {
      console.warn('Cache clear notice:', e);
    }
  }
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch (e) {
      console.warn('SW unregister notice:', e);
    }
  }
  window.location.reload();
}
