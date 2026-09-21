import { HomeWatchVisitScheduleItem, RecurringFrequency } from '../types';

/**
 * Calculates next date string (YYYY-MM-DD) given a base date and frequency
 */
export function addFrequencyInterval(baseDateStr: string, frequency: RecurringFrequency, intervalDays: number = 14): string {
  const date = new Date(baseDateStr);
  if (isNaN(date.getTime())) {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }

  switch (frequency) {
    case 'Weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'Every 2 Weeks':
      date.setDate(date.getDate() + 14);
      break;
    case 'Monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'Every 2 Months':
      date.setMonth(date.getMonth() + 2);
      break;
    case 'Quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'Custom':
      date.setDate(date.getDate() + (intervalDays > 0 ? intervalDays : 14));
      break;
    default:
      date.setDate(date.getDate() + 14);
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Automatically generates a multi-visit schedule for a finite Home Watch package
 */
export function generateHomeWatchSchedule(
  startDateStr: string,
  preferredTime: string = '10:00',
  frequency: RecurringFrequency = 'Every 2 Weeks',
  totalVisits: number = 4,
  customIntervalDays?: number
): HomeWatchVisitScheduleItem[] {
  const schedule: HomeWatchVisitScheduleItem[] = [];
  let currentDate = startDateStr || new Date().toISOString().slice(0, 10);

  for (let i = 1; i <= totalVisits; i++) {
    schedule.push({
      visitNumber: i,
      scheduledDate: currentDate,
      scheduledTime: preferredTime || '10:00',
      status: i === 1 ? 'Scheduled' : 'Upcoming',
    });

    currentDate = addFrequencyInterval(currentDate, frequency, customIntervalDays);
  }

  return schedule;
}

/**
 * Formats a visit date for clean scannable display (e.g. "22 Sep 2026" or "22 ก.ย. 2026")
 */
export function formatVisitDate(dateStr: string, isTh: boolean = false): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(isTh ? 'th-TH' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {}
  return dateStr;
}
