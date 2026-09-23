import { InspectionJob, Customer, Property } from '../types';
import { getLocalizedServiceName } from './serviceWorkflow';
import { formatDateDisplay, formatTime24h } from './dateTime';

export interface ShareTechnicianResult {
  success: boolean;
  method: 'share_api' | 'clipboard';
  messageText: string;
  error?: string;
}

/**
 * Generates clean, compact, professional bilingual message for technician dispatch
 */
export function formatTechnicianJobMessage(
  job: InspectionJob,
  customer?: Customer,
  property?: Property,
  lang: 'en' | 'th' = 'th'
): string {
  const isTh = lang === 'th';
  const serviceTitle = getLocalizedServiceName(job.serviceType, lang);
  const villaName = job.villaName || property?.name || (isTh ? 'วิลล่า / สถานที่' : 'Property / Villa');
  const location = job.propertyLocation || property?.area || 'Phuket, Thailand';
  const dateStr = formatDateDisplay(job.scheduledDate || job.inspectionDate, lang) || (isTh ? 'วันนี้' : 'Today');
  const timeStr = formatTime24h(job.scheduledTime) || (isTh ? 'ตามนัดหมาย' : 'As agreed');
  const clientName = job.customerName || customer?.name || (isTh ? 'ลูกค้า PTL' : 'PTL Client');
  const phone = customer?.phone || job.customerPhone || '';

  // Clean Google Maps link
  const mapsSearchQuery = `${villaName}, ${location}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsSearchQuery)}`;

  const notes = job.siteNotes || job.notes || job.requestDescription || (isTh ? 'ไม่มีหมายเหตุเพิ่มเติม' : 'No additional notes');

  const lines = [
    `🔧 [PTL ส่งงานช่าง / PTL Job Dispatch]`,
    `📍 สถานที่ / Villa: ${villaName}`,
    `🛠 ประเภทงาน / Service: ${serviceTitle}`,
    `📅 วันที่ / Date: ${dateStr}`,
    `⏰ เวลา / Time: ${timeStr}`,
    `🗺️ แผนที่ / Google Maps: ${mapsUrl}`,
    `👤 ลูกค้า / Contact: ${clientName}${phone ? ` (${phone})` : ''}`,
    `📝 รายละเอียด / Notes: ${notes}`,
  ];

  if (job.siteAccessNotes) {
    lines.push(`🔑 รหัสเข้าวิลล่า / Access: ${job.siteAccessNotes}`);
  }

  lines.push(`-------------------------`);
  lines.push(`Phuket Trusted Local (PTL) Field Operations`);

  return lines.join('\n');
}

/**
 * Shares job details to technician via Web Share API or Clipboard fallback
 */
export async function shareJobToTechnician(
  job: InspectionJob,
  customer?: Customer,
  property?: Property,
  lang: 'en' | 'th' = 'th'
): Promise<ShareTechnicianResult> {
  const messageText = formatTechnicianJobMessage(job, customer, property, lang);
  const title = `PTL Job: ${job.villaName || job.serviceType}`;

  // 1. Try Mobile Web Share API first
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text: messageText,
      });
      return {
        success: true,
        method: 'share_api',
        messageText,
      };
    } catch (err: any) {
      // If user aborted/cancelled share sheet, don't fallback to error alert
      if (err.name === 'AbortError') {
        return {
          success: false,
          method: 'share_api',
          messageText,
          error: 'Share cancelled',
        };
      }
      // Otherwise fall through to clipboard
    }
  }

  // 2. Fallback to Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(messageText);
      return {
        success: true,
        method: 'clipboard',
        messageText,
      };
    } catch (err: any) {
      return {
        success: false,
        method: 'clipboard',
        messageText,
        error: err?.message || 'Could not copy to clipboard',
      };
    }
  }

  return {
    success: false,
    method: 'clipboard',
    messageText,
    error: 'Sharing not supported on this browser',
  };
}
