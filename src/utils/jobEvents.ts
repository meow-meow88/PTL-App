import { InspectionJob, JobEvent, JobEventType, ActorType, ExecutionMode } from '../types';

export const PHUKET_SERVICE_AREAS = [
  'Rawai',
  'Chalong',
  'Nai Harn',
  'Kata / Karon',
  'Patong',
  'Phuket Town',
  'Kathu',
  'Kamala',
  'Surin',
  'Bang Tao / Cherng Talay',
  'Thalang',
  'Layan',
  'Mai Khao',
  'Koh Kaew / Boat Lagoon',
  'Ao Po / Pa Klok',
  'Chalong Pier / Island Transfer',
] as const;

/**
 * Creates a unique, structured JobEvent object.
 * Strictly records meaningful business/work events.
 */
export function createJobEvent(params: {
  jobId: string;
  eventType: JobEventType;
  actorType?: ActorType;
  actorId?: string;
  actorName?: string;
  summary?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}): JobEvent {
  const timestamp = params.createdAt || new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const eventId = `EVT-${timestamp.slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;

  return {
    id: eventId,
    jobId: params.jobId,
    eventType: params.eventType,
    actorType: params.actorType || 'OWNER',
    actorId: params.actorId,
    actorName: params.actorName || (params.actorType === 'VENDOR' ? 'Vendor' : 'PTL Owner'),
    createdAt: timestamp,
    summary: params.summary || defaultEventSummary(params.eventType, params.metadata),
    metadata: params.metadata,
  };
}

function defaultEventSummary(eventType: JobEventType, metadata?: Record<string, any>): string {
  switch (eventType) {
    case 'JOB_CREATED':
      return 'Job record created';
    case 'JOB_ASSIGNED':
      return metadata?.assignedTo ? `Assigned to ${metadata.assignedTo}` : 'Job assignment updated';
    case 'JOB_STARTED':
      return 'On-site work / inspection started';
    case 'STATUS_CHANGED':
      return metadata?.status ? `Status changed to ${metadata.status}` : 'Job status updated';
    case 'PHOTO_ADDED':
      return metadata?.caption ? `Photo added: ${metadata.caption}` : 'Field photo evidence recorded';
    case 'CHECKLIST_UPDATED':
      return metadata?.itemTitle ? `Checklist item updated: ${metadata.itemTitle}` : 'Checklist progress updated';
    case 'ISSUE_REPORTED':
      return metadata?.issue ? `Issue reported: ${metadata.issue}` : 'On-site issue identified';
    case 'QUOTE_CREATED':
      return metadata?.refNo ? `Quotation ${metadata.refNo} generated` : 'Quotation generated';
    case 'CUSTOMER_APPROVED':
      return 'Customer approved quotation / work scope';
    case 'PAYMENT_RECORDED':
      return metadata?.amount ? `Payment recorded: ฿${Number(metadata.amount).toLocaleString()}` : 'Payment recorded';
    case 'JOB_COMPLETED':
      return 'Job and field deliverables marked completed';
    case 'JOB_CANCELLED':
      return metadata?.reason ? `Job cancelled: ${metadata.reason}` : 'Job cancelled';
    case 'OWNER_REVIEWED':
      return 'Job reviewed and verified by Owner';
    default:
      return 'Job activity recorded';
  }
}

/**
 * Appends a meaningful event to an InspectionJob and guarantees
 * reliable lastActivityAt synchronization.
 */
export function recordJobActivity(
  job: InspectionJob,
  eventType: JobEventType,
  options?: {
    actorType?: ActorType;
    actorId?: string;
    actorName?: string;
    summary?: string;
    metadata?: Record<string, any>;
    customTimestamp?: string;
  }
): InspectionJob {
  const now = options?.customTimestamp || new Date().toISOString();
  const newEvent = createJobEvent({
    jobId: job.id,
    eventType,
    actorType: options?.actorType || job.assignedToType || 'OWNER',
    actorId: options?.actorId || job.assignedToId,
    actorName: options?.actorName || (job.assignedToType === 'VENDOR' ? job.assignedVendorName : 'PTL Owner'),
    summary: options?.summary,
    metadata: options?.metadata,
    createdAt: now,
  });

  // Keep up to 100 most recent events, chronologically sorted, deduped by ID
  const existingEvents = Array.isArray(job.events) ? job.events : [];
  const combined = [...existingEvents, newEvent];
  const seenIds = new Set<string>();
  const deduped: JobEvent[] = [];
  for (let i = combined.length - 1; i >= 0; i--) {
    const ev = combined[i];
    if (ev && ev.id && !seenIds.has(ev.id)) {
      seenIds.add(ev.id);
      deduped.unshift(ev);
    }
  }

  // Manage actual times
  const actualStartedAt =
    eventType === 'JOB_STARTED'
      ? (job.actualStartedAt || now)
      : job.actualStartedAt;

  const actualCompletedAt =
    eventType === 'JOB_COMPLETED'
      ? (job.actualCompletedAt || now)
      : job.actualCompletedAt;

  return {
    ...job,
    lastActivityAt: now,
    actualStartedAt,
    actualCompletedAt,
    events: deduped.slice(-100),
  };
}

/**
 * Returns formatted last activity string (e.g., '14:37' or 'Today 14:37')
 */
export function formatLastActivity(timestamp?: string, lang: 'en' | 'th' = 'en'): string {
  if (!timestamp) return lang === 'th' ? 'ไม่มีข้อมูล' : 'No activity';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;

    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const timeStr = date.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) {
      return timeStr;
    }

    const dateStr = date.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    });

    return `${dateStr} ${timeStr}`;
  } catch {
    return timestamp;
  }
}
