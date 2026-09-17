import { Customer, Property, InspectionJob } from '../types';
import { idbGet, idbSet, safeGetLocalStorage, safeSetLocalStorage } from './storage';
import { initialCustomersSeed, initialPropertiesSeed } from '../data/crmSeedData';

const CUSTOMERS_KEY = 'ptl_customers_archive';
const PROPERTIES_KEY = 'ptl_properties_archive';

/**
 * Load Customers from IndexedDB or LocalStorage with automatic seed fallback
 */
export async function loadCustomers(): Promise<Customer[]> {
  try {
    const idbData = await idbGet<Customer[]>(CUSTOMERS_KEY);
    if (Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }

    const lsData = safeGetLocalStorage(CUSTOMERS_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sync to IndexedDB
        idbSet(CUSTOMERS_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[crmStorage] Error loading customers:', err);
  }

  // Fallback to initial seed
  await saveCustomers(initialCustomersSeed);
  return initialCustomersSeed;
}

/**
 * Save Customers with dual persistence (IndexedDB + safe LocalStorage)
 */
export async function saveCustomers(customers: Customer[]): Promise<void> {
  if (!Array.isArray(customers)) return;
  try {
    await idbSet(CUSTOMERS_KEY, customers);
    safeSetLocalStorage(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (err) {
    console.warn('[crmStorage] Error saving customers:', err);
  }
}

/**
 * Load Properties from IndexedDB or LocalStorage with automatic seed fallback
 */
export async function loadProperties(): Promise<Property[]> {
  try {
    const idbData = await idbGet<Property[]>(PROPERTIES_KEY);
    if (Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }

    const lsData = safeGetLocalStorage(PROPERTIES_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        idbSet(PROPERTIES_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[crmStorage] Error loading properties:', err);
  }

  // Fallback to initial seed
  await saveProperties(initialPropertiesSeed);
  return initialPropertiesSeed;
}

/**
 * Save Properties with dual persistence
 */
export async function saveProperties(properties: Property[]): Promise<void> {
  if (!Array.isArray(properties)) return;
  try {
    await idbSet(PROPERTIES_KEY, properties);
    safeSetLocalStorage(PROPERTIES_KEY, JSON.stringify(properties));
  } catch (err) {
    console.warn('[crmStorage] Error saving properties:', err);
  }
}

/**
 * Auto-sync helper: Ensure any client/villa in existing jobs has a matching Customer & Property record
 * Derives records from clientId, customerName, customerGroup, villaName, propertyLocation without duplicates.
 */
export function ensureCustomerAndPropertyForJob(
  job: InspectionJob,
  customers: Customer[],
  properties: Property[]
): { updatedCustomers: Customer[]; updatedProperties: Property[]; customerId: string; propertyId: string } {
  // Normalize names for comparison
  const jobCustName = (job.customerName || '').trim().toLowerCase();
  const jobClientId = (job.clientId || '').trim().toLowerCase();

  let matchedCustomer = customers.find((c) => {
    if (job.customerId && c.id.toLowerCase() === job.customerId.toLowerCase()) return true;
    if (jobClientId && (c.id.toLowerCase() === jobClientId || c.id.toLowerCase() === `cust-${jobClientId}`)) return true;
    const cName = (c.name || c.fullName || '').trim().toLowerCase();
    const cPref = (c.preferredName || '').trim().toLowerCase();
    if (jobCustName && cName === jobCustName) return true;
    if (jobCustName && cPref && (jobCustName === cPref || jobCustName.startsWith(cPref))) return true;
    return false;
  });

  let updatedCustomers = [...customers];
  if (!matchedCustomer) {
    const derivedId = job.clientId
      ? (job.clientId.toUpperCase().startsWith('CUST-') ? job.clientId.toUpperCase() : `CUST-${job.clientId.toUpperCase()}`)
      : `CUST-${Date.now().toString().slice(-6)}`;

    const newCust: Customer = {
      id: derivedId,
      name: job.customerName || 'Client',
      fullName: job.customerName || 'Client',
      preferredName: (job.customerName || 'Client').split(' ')[0],
      email: '',
      phone: '',
      lineWhatsapp: '',
      lineOrWhatsapp: '',
      customerType:
        job.customerGroup === 'expat'
          ? 'Expat'
          : job.customerGroup === 'rental_investor'
          ? 'Property Manager'
          : 'Overseas Property Owner',
      notes: `Derived from existing job record (${job.id}).`,
      status: 'Active',
      createdAt: job.createdAt || new Date().toISOString(),
      lastContact: job.inspectionDate || new Date().toISOString(),
    };
    updatedCustomers.push(newCust);
    matchedCustomer = newCust;
  }

  // Derive stable property
  const jobVilla = (job.villaName || '').trim().toLowerCase();
  const jobLoc = (job.propertyLocation || '').trim().toLowerCase();

  let matchedProperty = properties.find((p) => {
    if (job.propertyId && p.id.toLowerCase() === job.propertyId.toLowerCase()) return true;
    const pName = (p.name || p.propertyName || '').trim().toLowerCase();
    if (jobVilla && pName === jobVilla) return true;
    if (jobVilla && pName.includes(jobVilla)) return true;
    if (jobLoc && pName.includes(jobLoc)) return true;
    return false;
  });

  let updatedProperties = [...properties];
  if (!matchedProperty) {
    // Detect area
    const combinedStr = `${job.villaName} ${job.propertyLocation}`.toLowerCase();
    let area = 'Phuket';
    if (combinedStr.includes('kathu')) area = 'Kathu';
    else if (combinedStr.includes('nai harn') || combinedStr.includes('naiharn')) area = 'Nai Harn';
    else if (combinedStr.includes('rawai')) area = 'Rawai';
    else if (combinedStr.includes('patong')) area = 'Patong';
    else if (combinedStr.includes('chalong')) area = 'Chalong';
    else if (combinedStr.includes('bang tao') || combinedStr.includes('bangtao')) area = 'Bang Tao';
    else if (combinedStr.includes('cherngtalay') || combinedStr.includes('surin')) area = 'Cherngtalay';
    else if (combinedStr.includes('kamala')) area = 'Kamala';

    const cleanSlug = (job.villaName || 'villa').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    const derivedPropId = `PROP-${cleanSlug.toUpperCase() || Date.now().toString().slice(-5)}`;

    const newProp: Property = {
      id: derivedPropId,
      customerId: matchedCustomer.id,
      name: job.villaName || job.propertyLocation || 'Client Villa',
      propertyName: job.villaName || job.propertyLocation || 'Client Villa',
      propertyType: 'Villa',
      address: job.propertyLocation || `${job.villaName || 'Phuket Property'}, Phuket, Thailand`,
      area,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(job.villaName || job.propertyLocation || 'Phuket')}`,
      accessInformation: 'Standard villa access. Confirm with owner or property manager.',
      accessInfo: 'Standard villa access. Confirm with owner or property manager.',
      contactPerson: job.customerName,
      notes: job.notes || '',
      importantNotes: job.notes || '',
      systems: ['CCTV', 'WiFi', 'Electrical'],
      systemsInstalled: ['CCTV', 'WiFi', 'Electrical'],
      lastInspection: job.inspectionDate,
    };
    updatedProperties.push(newProp);
    matchedProperty = newProp;
  }

  return {
    updatedCustomers,
    updatedProperties,
    customerId: matchedCustomer.id,
    propertyId: matchedProperty.id,
  };
}
