import type { JobPurpose } from '../types';

export const JOB_PURPOSES: JobPurpose[] = [
  'INSPECTION_DIAGNOSIS', 'FAULT_FINDING', 'REPAIR', 'REPLACEMENT',
  'INSTALLATION', 'MAINTENANCE', 'KNOWN_SCOPE_SERVICE',
  'HOME_WATCH_VISIT', 'ASSISTANCE', 'VENDOR_COORDINATION', 'FOLLOW_UP',
];

// This is a suggestion for a newly selected service, never a migration of saved jobs.
export function suggestJobPurpose(serviceId: string): JobPurpose {
  switch (serviceId) {
    case 'home_watch': return 'HOME_WATCH_VISIT';
    case 'property_visit': return 'INSPECTION_DIAGNOSIS';
    case 'property_coordination':
    case 'vendor_coordination':
    case 'repair_supervision': return 'VENDOR_COORDINATION';
    case 'internet_wifi':
    case 'cctv':
    case 'smart_home':
    case 'electrical':
    case 'other_technical': return 'FAULT_FINDING';
    case 'delivery_installation': return 'INSTALLATION';
    case 'roadside_tire':
    case 'key_access':
    case 'hospital_doctor':
    case 'pet_vet':
    case 'transportation':
    case 'appointment_assistance':
    case 'general_assistance': return 'ASSISTANCE';
    default: return 'KNOWN_SCOPE_SERVICE';
  }
}
