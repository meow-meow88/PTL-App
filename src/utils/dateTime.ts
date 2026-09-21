/**
 * PTL 24-Hour Date and Time Utility Functions
 * Ensures strict 24-hour time formatting across all operational UI (no AM/PM).
 */

export function formatTime24h(timeStr?: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  // Check if string contains AM or PM
  const upper = trimmed.toUpperCase();
  const isPM = upper.includes('PM');
  const isAM = upper.includes('AM');

  // Strip AM/PM and spaces
  const clean = trimmed.replace(/[a-zA-Z\s]/g, '');
  const parts = clean.split(':');
  if (parts.length === 0 || !parts[0]) return trimmed;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;

  if (isNaN(hours)) return trimmed;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(isNaN(minutes) ? 0 : minutes).padStart(2, '0');
  return `${hStr}:${mStr}`;
}

export function formatDateDisplay(dateStr?: string, lang: 'en' | 'th' = 'en'): string {
  if (!dateStr) return '';
  const isTh = lang === 'th';

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateStr === todayStr || dateStr === 'Today' || dateStr === 'วันนี้') {
    return isTh ? 'วันนี้' : 'Today';
  }
  if (dateStr === tomorrowStr || dateStr === 'Tomorrow' || dateStr === 'พรุ่งนี้') {
    return isTh ? 'พรุ่งนี้' : 'Tomorrow';
  }
  if (dateStr === yesterdayStr) {
    return isTh ? 'เมื่อวาน' : 'Yesterday';
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(isTh ? 'th-TH' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: isTh ? undefined : 'numeric',
      });
    }
  } catch {}

  return dateStr;
}

export function isDateToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return dateStr === todayStr || dateStr === 'Today' || dateStr === 'วันนี้';
}

export function isDateTomorrow(dateStr?: string): boolean {
  if (!dateStr) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  return dateStr === tomorrowStr || dateStr === 'Tomorrow' || dateStr === 'พรุ่งนี้';
}
