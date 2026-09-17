import { Expense, Invoice, Payment, InspectionJob, InvoiceStatus, PaymentMethod } from '../types';
import { idbGet, idbSet, safeGetLocalStorage, safeSetLocalStorage } from './storage';
import { initialExpensesSeed, initialInvoicesSeed, initialPaymentsSeed } from '../data/financeSeedData';

const EXPENSES_KEY = 'ptl_expenses_archive';
const INVOICES_KEY = 'ptl_invoices_archive';
const PAYMENTS_KEY = 'ptl_payments_archive';

/**
 * Load Expenses with dual persistence (IndexedDB -> LocalStorage -> Seed)
 */
export async function loadExpenses(): Promise<Expense[]> {
  try {
    const idbData = await idbGet<Expense[]>(EXPENSES_KEY);
    if (Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(EXPENSES_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        idbSet(EXPENSES_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[financeStorage] Error loading expenses:', err);
  }

  // Fallback to initial seed
  await saveExpenses(initialExpensesSeed);
  return initialExpensesSeed;
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  if (!Array.isArray(expenses)) return;
  try {
    await idbSet(EXPENSES_KEY, expenses);
    safeSetLocalStorage(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.warn('[financeStorage] Error saving expenses:', err);
  }
}

/**
 * Load Invoices with dual persistence
 */
export async function loadInvoices(): Promise<Invoice[]> {
  try {
    const idbData = await idbGet<Invoice[]>(INVOICES_KEY);
    if (Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(INVOICES_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        idbSet(INVOICES_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[financeStorage] Error loading invoices:', err);
  }

  await saveInvoices(initialInvoicesSeed);
  return initialInvoicesSeed;
}

export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  if (!Array.isArray(invoices)) return;
  try {
    await idbSet(INVOICES_KEY, invoices);
    safeSetLocalStorage(INVOICES_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.warn('[financeStorage] Error saving invoices:', err);
  }
}

/**
 * Load Payments with dual persistence
 */
export async function loadPayments(): Promise<Payment[]> {
  try {
    const idbData = await idbGet<Payment[]>(PAYMENTS_KEY);
    if (Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(PAYMENTS_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        idbSet(PAYMENTS_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[financeStorage] Error loading payments:', err);
  }

  await savePayments(initialPaymentsSeed);
  return initialPaymentsSeed;
}

export async function savePayments(payments: Payment[]): Promise<void> {
  if (!Array.isArray(payments)) return;
  try {
    await idbSet(PAYMENTS_KEY, payments);
    safeSetLocalStorage(PAYMENTS_KEY, JSON.stringify(payments));
  } catch (err) {
    console.warn('[financeStorage] Error saving payments:', err);
  }
}

/**
 * Generate Invoice from Job (preserves existing quotation, creates a separate Invoice record)
 */
export function createInvoiceFromJob(
  job: InspectionJob,
  existingInvoices: Invoice[]
): Invoice {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const due = new Date();
  due.setDate(due.getDate() + 14); // 14 days payment terms
  const dueDateStr = due.toISOString().slice(0, 10);

  const seq = String(existingInvoices.length + 1).padStart(3, '0');
  const invoiceNumber = `PTL-INV-${dateStr.replace(/-/g, '').slice(0, 6)}-${seq}`;
  const newInvoiceId = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  // Extract items from quotation or single service
  const items = [];
  let subtotal = 0;

  if (job.quotation?.serviceItems && job.quotation.serviceItems.length > 0) {
    for (const s of job.quotation.serviceItems) {
      items.push({
        item: items.length + 1,
        description: s.description,
        detail: s.detail,
        qty: s.qty || '1 Job',
        unitPrice: s.amount,
        amount: s.amount,
        categoryType: 'Service' as const,
      });
      subtotal += s.amount || 0;
    }
  }

  if (job.quotation?.hardwareItems && job.quotation.hardwareItems.length > 0) {
    for (const h of job.quotation.hardwareItems) {
      items.push({
        item: items.length + 1,
        description: h.descriptionEn,
        detail: h.descriptionTh,
        qty: h.qty || 1,
        unitPrice: h.unitPrice,
        amount: h.amount,
        categoryType: 'Hardware' as const,
      });
      subtotal += h.amount || 0;
    }
    // Add procurement fee if applicable
    const feeRate = job.quotation.procurementFeeRate ?? 0.15;
    const hwSub = job.quotation.hardwareItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const feeAmt = hwSub * feeRate;
    if (feeAmt > 0) {
      items.push({
        item: items.length + 1,
        description: `Procurement & Coordination Fee (${Math.round(feeRate * 100)}%)`,
        detail: 'Quality verification, logistics & supplier coordination',
        qty: '1 Fee',
        unitPrice: Math.round(feeAmt),
        amount: Math.round(feeAmt),
        categoryType: 'Fee' as const,
      });
      subtotal += Math.round(feeAmt);
    }
  }

  // If no items were found, use job price or default
  if (items.length === 0) {
    const defaultAmount = typeof job.price === 'number' && job.price > 0 ? job.price : 1500;
    items.push({
      item: 1,
      description: job.serviceType || 'Field Service & Support',
      detail: job.requestDescription || `Site visit for ${job.villaName}`,
      qty: '1 Job',
      unitPrice: defaultAmount,
      amount: defaultAmount,
      categoryType: 'Service' as const,
    });
    subtotal = defaultAmount;
  }

  const total = subtotal; // No tax by default for local solo operator
  const amountPaid = job.status === 'Paid' ? total : 0;
  const balanceDue = total - amountPaid;
  const initialStatus: InvoiceStatus =
    amountPaid >= total ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Sent';

  return {
    id: newInvoiceId,
    invoiceNumber,
    jobId: job.id,
    customerId: job.customerId || job.clientId,
    propertyId: job.propertyId,
    issueDate: dateStr,
    dueDate: dueDateStr,
    status: initialStatus,
    items,
    subtotal,
    discount: 0,
    tax: 0,
    total,
    amountPaid,
    balanceDue,
    notes: `Generated for Job ${job.id} (${job.villaName}). Payment due within 14 days.`,
    createdAt: now.toISOString(),
  };
}

/**
 * Record a payment against an invoice and update balance / invoice status automatically:
 * 0 paid -> Sent
 * some paid -> Partially Paid
 * fully paid -> Paid
 */
export function recordPayment(
  params: {
    invoiceId: string;
    jobId: string;
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
    date?: string;
  },
  invoices: Invoice[],
  payments: Payment[]
): { updatedInvoices: Invoice[]; updatedPayments: Payment[]; newPayment: Payment } {
  const paymentDate = params.date || new Date().toISOString().slice(0, 10);
  const newPayment: Payment = {
    id: `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    invoiceId: params.invoiceId,
    jobId: params.jobId,
    customerId: params.customerId,
    date: paymentDate,
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    reference: params.reference?.trim() || '',
    notes: params.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  const nextPayments = [newPayment, ...payments];

  // Update target invoice
  const updatedInvoices = invoices.map((inv) => {
    if (inv.id !== params.invoiceId) return inv;

    // Calculate total paid across all payments for this invoice
    const invPayments = nextPayments.filter((p) => p.invoiceId === inv.id);
    const totalPaid = invPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balanceDue = Math.max(0, inv.total - totalPaid);

    let status: InvoiceStatus = inv.status;
    if (balanceDue <= 0) {
      status = 'Paid';
    } else if (totalPaid > 0) {
      status = 'Partially Paid';
    } else {
      status = 'Sent';
    }

    return {
      ...inv,
      amountPaid: totalPaid,
      balanceDue,
      status,
    };
  });

  return {
    updatedInvoices,
    updatedPayments: nextPayments,
    newPayment,
  };
}
