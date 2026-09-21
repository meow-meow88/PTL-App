import { Customer, Property, InspectionJob, Invoice, RecurringService } from '../types';
import { idbGet, idbSet, safeGetLocalStorage, safeSetLocalStorage } from './storage';
import { initialCustomersSeed, initialPropertiesSeed } from '../data/crmSeedData';

const CUSTOMERS_KEY = 'ptl_customers_archive';
const PROPERTIES_KEY = 'ptl_properties_archive';

/**
 * Deduplicate properties by normalized ID (case-insensitive)
 * Ensures every property in memory and storage has a strictly unique ID.
 */
export function deduplicateProperties(props: Property[]): Property[] {
  if (!Array.isArray(props)) return [];
  const seenIds = new Set<string>();
  const cleanList: Property[] = [];

  for (const p of props) {
    if (!p || !p.id) continue;
    const normId = p.id.trim().toUpperCase();
    if (seenIds.has(normId)) {
      continue;
    }
    seenIds.add(normId);
    cleanList.push({
      ...p,
      id: normId,
      name: p.name || p.propertyName || 'Phuket Property',
      propertyName: p.propertyName || p.name || 'Phuket Property',
    });
  }

  return cleanList;
}

/**
 * Deduplicate customers by normalized ID (case-insensitive)
 */
export function deduplicateCustomers(custs: Customer[]): Customer[] {
  if (!Array.isArray(custs)) return [];
  const seenIds = new Set<string>();
  const cleanList: Customer[] = [];

  for (const c of custs) {
    if (!c || !c.id) continue;
    const normId = c.id.trim().toUpperCase();
    if (seenIds.has(normId)) {
      continue;
    }
    seenIds.add(normId);
    cleanList.push({
      ...c,
      id: normId,
      name: c.name || c.fullName || c.preferredName || 'Client',
      fullName: c.fullName || c.name || 'Client',
    });
  }

  return cleanList;
}

/**
 * Load Customers from IndexedDB or LocalStorage with automatic seed fallback and deduplication
 */
export async function loadCustomers(): Promise<Customer[]> {
  try {
    const idbData = await idbGet<Customer[]>(CUSTOMERS_KEY);
    if (Array.isArray(idbData) && idbData.length > 0) {
      const clean = deduplicateCustomers(idbData);
      if (clean.length !== idbData.length) {
        // Auto-heal storage
        await saveCustomers(clean);
      }
      return clean;
    }

    const lsData = safeGetLocalStorage(CUSTOMERS_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = deduplicateCustomers(parsed);
        idbSet(CUSTOMERS_KEY, clean);
        if (clean.length !== parsed.length) {
          safeSetLocalStorage(CUSTOMERS_KEY, JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch (err) {
    console.warn('[crmStorage] Error loading customers:', err);
  }

  // Fallback to initial seed
  const cleanSeed = deduplicateCustomers(initialCustomersSeed);
  await saveCustomers(cleanSeed);
  return cleanSeed;
}

/**
 * Save Customers with dual persistence (IndexedDB + safe LocalStorage) with deduplication
 */
export async function saveCustomers(customers: Customer[]): Promise<void> {
  if (!Array.isArray(customers)) return;
  const clean = deduplicateCustomers(customers);
  try {
    await idbSet(CUSTOMERS_KEY, clean);
    safeSetLocalStorage(CUSTOMERS_KEY, JSON.stringify(clean));
  } catch (err) {
    console.warn('[crmStorage] Error saving customers:', err);
  }
}

/**
 * Load Properties from IndexedDB or LocalStorage with automatic seed fallback and deduplication
 */
export async function loadProperties(): Promise<Property[]> {
  try {
    const idbData = await idbGet<Property[]>(PROPERTIES_KEY);
    if (Array.isArray(idbData) && idbData.length > 0) {
      const clean = deduplicateProperties(idbData);
      if (clean.length !== idbData.length) {
        // Auto-heal dirty storage containing duplicate keys (e.g. PROP-GREENMILEV)
        await saveProperties(clean);
      }
      return clean;
    }

    const lsData = safeGetLocalStorage(PROPERTIES_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = deduplicateProperties(parsed);
        idbSet(PROPERTIES_KEY, clean);
        if (clean.length !== parsed.length) {
          safeSetLocalStorage(PROPERTIES_KEY, JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch (err) {
    console.warn('[crmStorage] Error loading properties:', err);
  }

  // Fallback to initial seed
  const cleanSeed = deduplicateProperties(initialPropertiesSeed);
  await saveProperties(cleanSeed);
  return cleanSeed;
}

/**
 * Save Properties with dual persistence and strict deduplication
 */
export async function saveProperties(properties: Property[]): Promise<void> {
  if (!Array.isArray(properties)) return;
  const clean = deduplicateProperties(properties);
  try {
    await idbSet(PROPERTIES_KEY, clean);
    safeSetLocalStorage(PROPERTIES_KEY, JSON.stringify(clean));
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
  const cleanCustomers = deduplicateCustomers(customers);
  const cleanProperties = deduplicateProperties(properties);

  // Normalize names for comparison
  const jobCustName = (job.customerName || '').trim().toLowerCase();
  const jobClientId = (job.clientId || '').trim().toLowerCase();

  let matchedCustomer = cleanCustomers.find((c) => {
    if (job.customerId && c.id.toLowerCase() === job.customerId.toLowerCase()) return true;
    if (jobClientId && (c.id.toLowerCase() === jobClientId || c.id.toLowerCase() === `cust-${jobClientId}`)) return true;
    const cName = (c.name || c.fullName || '').trim().toLowerCase();
    const cPref = (c.preferredName || '').trim().toLowerCase();
    if (jobCustName && cName === jobCustName) return true;
    if (jobCustName && cPref && (jobCustName === cPref || jobCustName.startsWith(cPref) || cPref.startsWith(jobCustName))) return true;
    if (jobCustName && (cName.includes(jobCustName) || jobCustName.includes(cName))) return true;
    return false;
  });

  let updatedCustomers = [...cleanCustomers];
  if (!matchedCustomer) {
    const derivedCustId = job.clientId
      ? (job.clientId.toUpperCase().startsWith('CUST-') ? job.clientId.toUpperCase() : `CUST-${job.clientId.toUpperCase()}`)
      : `CUST-${Date.now().toString().slice(-6)}`;

    // Check if derivedCustId already exists
    const existingWithId = updatedCustomers.find((c) => c.id.toUpperCase() === derivedCustId.toUpperCase());
    if (existingWithId) {
      matchedCustomer = existingWithId;
    } else {
      let finalCustId = derivedCustId;
      let cSuffix = 1;
      while (updatedCustomers.some((c) => c.id.toUpperCase() === finalCustId.toUpperCase())) {
        finalCustId = `${derivedCustId}-${cSuffix++}`;
      }

      const newCust: Customer = {
        id: finalCustId,
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
  }

  // Derive stable property
  const jobVilla = (job.villaName || '').trim().toLowerCase();
  const jobLoc = (job.propertyLocation || '').trim().toLowerCase();

  const cleanSlug = (job.villaName || job.propertyLocation || 'villa')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  const derivedPropId = `PROP-${cleanSlug.toUpperCase() || Date.now().toString().slice(-5)}`;

  let matchedProperty = cleanProperties.find((p) => {
    // 1. Direct ID match
    if (job.propertyId && p.id.toLowerCase() === job.propertyId.toLowerCase()) return true;
    // 2. Exact match with derivedPropId
    if (p.id.toUpperCase() === derivedPropId.toUpperCase()) return true;

    const pName = (p.name || p.propertyName || '').trim().toLowerCase();
    const pAddr = (p.address || '').trim().toLowerCase();

    // 3. Exact name match
    if (jobVilla && pName === jobVilla) return true;

    // 4. Bidirectional substring match
    if (jobVilla && (pName.includes(jobVilla) || jobVilla.includes(pName))) return true;
    if (jobLoc && (pName.includes(jobLoc) || jobLoc.includes(pName))) return true;
    if (jobLoc && pAddr && (pAddr.includes(jobLoc) || jobLoc.includes(pAddr))) return true;

    // 5. Significant token match (e.g. "green mile", "baan bua", "the deck")
    const meaningfulTokens = (job.villaName || '')
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((t) => t.length >= 4 && !['villa', 'house', 'residence', 'kathu', 'phuket', 'rawai', 'patong'].includes(t));
    if (meaningfulTokens.length > 0 && meaningfulTokens.some((tok) => pName.includes(tok))) {
      return true;
    }

    // 6. Owner property match if customer already owns this property
    if (matchedCustomer && p.customerId === matchedCustomer.id && jobVilla) {
      if (pName.includes('villa') && jobVilla.includes('villa')) return true;
    }

    return false;
  });

  let updatedProperties = [...cleanProperties];
  if (!matchedProperty) {
    // Check if derivedPropId already exists in updatedProperties to prevent duplicate IDs
    const existingWithPropId = updatedProperties.find((p) => p.id.toUpperCase() === derivedPropId.toUpperCase());
    if (existingWithPropId) {
      matchedProperty = existingWithPropId;
    } else {
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

      // Ensure guaranteed unique ID
      let finalPropId = derivedPropId;
      let pSuffix = 1;
      while (updatedProperties.some((p) => p.id.toUpperCase() === finalPropId.toUpperCase())) {
        finalPropId = `${derivedPropId}-${pSuffix++}`;
      }

      const newProp: Property = {
        id: finalPropId,
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
  }

  return {
    updatedCustomers: deduplicateCustomers(updatedCustomers),
    updatedProperties: deduplicateProperties(updatedProperties),
    customerId: matchedCustomer.id,
    propertyId: matchedProperty.id,
  };
}

export interface CustomerSafetyReport {
  canPermanentlyDelete: boolean;
  propertiesCount: number;
  jobsCount: number;
  invoicesCount: number;
  recurringCount: number;
  message: string;
}

export function checkCustomerDeleteSafety(
  customerId: string,
  properties: Property[],
  jobs: InspectionJob[],
  invoices: Invoice[] = [],
  recurring: RecurringService[] = []
): CustomerSafetyReport {
  const normId = (customerId || '').trim().toUpperCase();
  const linkedProps = properties.filter((p) => p.customerId && p.customerId.trim().toUpperCase() === normId);
  const linkedJobs = jobs.filter(
    (j) =>
      (j.customerId && j.customerId.trim().toUpperCase() === normId) ||
      (j.clientId && j.clientId.trim().toUpperCase() === normId)
  );
  const linkedInvoices = invoices.filter((i) => i.customerId && i.customerId.trim().toUpperCase() === normId);
  const linkedRecurring = recurring.filter((r) => r.customerId && r.customerId.trim().toUpperCase() === normId);

  const totalLinked = linkedProps.length + linkedJobs.length + linkedInvoices.length + linkedRecurring.length;

  return {
    canPermanentlyDelete: totalLinked === 0,
    propertiesCount: linkedProps.length,
    jobsCount: linkedJobs.length,
    invoicesCount: linkedInvoices.length,
    recurringCount: linkedRecurring.length,
    message:
      totalLinked === 0
        ? 'Customer has no linked records and can be permanently deleted.'
        : `Customer has history (${linkedProps.length} properties, ${linkedJobs.length} jobs, ${linkedInvoices.length} invoices, ${linkedRecurring.length} recurring services). Archive instead.`,
  };
}

export interface PropertySafetyReport {
  canPermanentlyDelete: boolean;
  jobsCount: number;
  invoicesCount: number;
  recurringCount: number;
  message: string;
}

export function checkPropertyDeleteSafety(
  propertyId: string,
  jobs: InspectionJob[],
  invoices: Invoice[] = [],
  recurring: RecurringService[] = []
): PropertySafetyReport {
  const normId = (propertyId || '').trim().toUpperCase();
  const linkedJobs = jobs.filter((j) => j.propertyId && j.propertyId.trim().toUpperCase() === normId);
  const linkedInvoices = invoices.filter((i) => i.propertyId && i.propertyId.trim().toUpperCase() === normId);
  const linkedRecurring = recurring.filter((r) => r.propertyId && r.propertyId.trim().toUpperCase() === normId);

  const totalLinked = linkedJobs.length + linkedInvoices.length + linkedRecurring.length;

  return {
    canPermanentlyDelete: totalLinked === 0,
    jobsCount: linkedJobs.length,
    invoicesCount: linkedInvoices.length,
    recurringCount: linkedRecurring.length,
    message:
      totalLinked === 0
        ? 'Property has no linked records and can be permanently deleted.'
        : `Property has history (${linkedJobs.length} jobs, ${linkedInvoices.length} invoices, ${linkedRecurring.length} recurring services). Archive instead.`,
  };
}


