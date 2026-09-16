import { useState, useEffect } from 'react';
import { DEFAULT_PTL_LOGO, DEFAULT_PTL_LOGO_BASE64 } from '../data/defaultLogo';
import { safeGetLocalStorage, safeSetLocalStorage, idbGet, idbSet } from './storage';

const LOGO_VERSION_KEY = 'ptl_logo_version';
const CURRENT_LOGO_VERSION = 'v7_exact_svg_vector';

export function useCustomLogo(): {
  logoUrl: string;
  fallbackLogoUrl: string;
  updateLogo: (file: File) => Promise<string>;
} {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    const currentVersion = safeGetLocalStorage(LOGO_VERSION_KEY);
    if (currentVersion !== CURRENT_LOGO_VERSION) {
      safeSetLocalStorage(LOGO_VERSION_KEY, CURRENT_LOGO_VERSION);
      safeSetLocalStorage('ptl_custom_logo', DEFAULT_PTL_LOGO_BASE64);
      idbSet('ptl_custom_logo', DEFAULT_PTL_LOGO_BASE64);
      return DEFAULT_PTL_LOGO_BASE64;
    }
    const saved = safeGetLocalStorage('ptl_custom_logo');
    if (!saved || saved.includes('apple-touch-icon') || saved.includes('undefined') || saved.trim() === '') {
      return DEFAULT_PTL_LOGO_BASE64;
    }
    return saved;
  });

  useEffect(() => {
    // 1. Check IndexedDB for persisted high-res logo in case localStorage was purged
    idbGet<string>('ptl_custom_logo').then((stored) => {
      const currentVersion = safeGetLocalStorage(LOGO_VERSION_KEY);
      if (currentVersion === CURRENT_LOGO_VERSION && stored && stored.startsWith('data:image')) {
        setLogoUrl(stored);
      }
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setLogoUrl(customEvent.detail);
      }
    };
    window.addEventListener('ptl_logo_updated', handleUpdate);

    // Fetch official persisted logo from server to guarantee it never resets or drifts
    fetch('/api/logo')
      .then((r) => r.json())
      .then((data) => {
        if (data?.dataUrl && data.dataUrl.startsWith('data:image')) {
          setLogoUrl(data.dataUrl);
          safeSetLocalStorage('ptl_custom_logo', data.dataUrl);
          idbSet('ptl_custom_logo', data.dataUrl);
        }
      })
      .catch((err) => {
        console.debug('Logo server sync fallback to default:', err);
      });

    return () => window.removeEventListener('ptl_logo_updated', handleUpdate);
  }, []);

  const updateLogo = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        // 1. Save locally and to IndexedDB safely without crashing
        safeSetLocalStorage(LOGO_VERSION_KEY, 'custom_' + Date.now());
        safeSetLocalStorage('ptl_custom_logo', dataUrl);
        idbSet('ptl_custom_logo', dataUrl);
        setLogoUrl(dataUrl);
        window.dispatchEvent(new CustomEvent('ptl_logo_updated', { detail: dataUrl }));

        // 2. Persist to server so public icons, PWA, and server endpoints receive the exact file
        try {
          await fetch('/api/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl }),
          });
        } catch (err) {
          console.warn('Server logo sync error:', err);
        }

        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return { logoUrl, fallbackLogoUrl: DEFAULT_PTL_LOGO_BASE64, updateLogo };
}

