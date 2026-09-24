import { Expense, Invoice, Payment, InspectionJob, InvoiceStatus, PaymentMethod } from '../types';
import { idbGet, idbSet, safeGetLocalStorage, safeSetLocalStorage } from './storage';
import { initialExpensesSeed, initialInvoicesSeed, initialPaymentsSeed } from '../data/financeSeedData';

const EXPENSES_KEY = 'ptl_expenses_archive';
const INVOICES_KEY = 'ptl_invoices_archive';
const PAYMENTS_KEY = 'ptl_payments_archive';

const money = (n: number) => Math.round(n * 100) / 100;

/** Record cash received for a job before its final invoice exists. */
export function recordMaterialAdvance(
  params: { jobId: string; customerId: string; amount: number; paymentMethod: PaymentMethod;
    date?: string; reference?: string; notes?: string; slips?: Payment['slips'] },
  jobs: InspectionJob[], payments: Payment[]
): Payment[] {
  const job = jobs.find((item) => item.id === params.jobId);
  if (!job || !params.customerId || (job.customerId || job.clientId) !== params.customerId) {
    throw new Error('Select a job and its matching customer.');
  }
  if (!Number.isFinite(params.amount) || params.amount <= 0) throw new Error('Enter a valid advance amount.');
  if (params.slips?.length && money(params.slips.reduce((sum, slip) => sum + slip.amount, 0)) !== money(params.amount)) {
    throw new Error('Transfer slip amounts must equal the advance.');
  }
  if (params.slips?.some((slip) => !Number.isFinite(slip.amount) || slip.amount <= 0)) throw new Error('Invalid slip amount.');
  const refs = new Set<string>();
  for (const slip of params.slips || []) {
    if (slip.imageDataUrl && payments.some((p) => p.slips?.some((saved) => saved.imageDataUrl === slip.imageDataUrl))) {
      throw new Error('This transfer slip image was already recorded.');
    }
    const ref = slip.reference?.trim().toLowerCase();
    if (ref && (refs.has(ref) || payments.some((p) => p.slips?.some((saved) => saved.reference?.trim().toLowerCase() === ref)))) {
      throw new Error(`Transfer reference ${slip.reference} has already been recorded.`);
    }
    if (ref) refs.add(ref);
  }
  const date = params.date || new Date().toISOString().slice(0, 10);
  return [{ id: `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    invoiceId: '', jobId: job.id, customerId: params.customerId, date,
    amount: params.amount, paymentMethod: params.paymentMethod,
    reference: params.reference?.trim(), notes: params.notes?.trim(), slips: params.slips,
    purpose: 'material_advance', allocations: [{itemIndex: -1, description: 'Material advance for ' + job.villaName, amount: params.amount}],
    receiptNumber: `PTL-RC-${date.replace(/-/g, '')}-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString() }, ...payments];
}

/** Apply an existing advance without creating a second cash receipt. */
export function applyMaterialAdvance(paymentId: string, invoiceId: string, invoices: Invoice[], payments: Payment[]) {
  const advance = payments.find((p) => p.id === paymentId && p.purpose === 'material_advance');
  const invoice = invoices.find((i) => i.id === invoiceId);
  if (!advance || !invoice || advance.appliedInvoiceId || advance.invoiceId) throw new Error('Advance is not available.');
  if (invoice.jobId !== advance.jobId || invoice.customerId !== advance.customerId) throw new Error('Advance belongs to a different job or customer.');
  const alreadyPaid = payments.filter((p) => p.invoiceId === invoiceId || p.appliedInvoiceId === invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
  const legacyPaid = Math.max(0, invoice.amountPaid - alreadyPaid);
  if (money(advance.amount) > money(invoice.total - legacyPaid - alreadyPaid)) throw new Error('Advance exceeds the invoice balance.');
  const updatedPayments = payments.map((p) => p.id === paymentId ? {...p, appliedInvoiceId: invoiceId} : p);
  const amountPaid = money(legacyPaid + alreadyPaid + advance.amount);
  const updatedInvoices = invoices.map((i) => i.id === invoiceId ? {...i, amountPaid, balanceDue: money(i.total - amountPaid),
    status: (money(i.total - amountPaid) === 0 ? 'Paid' : 'Partially Paid') as InvoiceStatus} : i);
  return {updatedPayments, updatedInvoices};
}

/**
 * Load Expenses with dual persistence (IndexedDB -> LocalStorage -> empty array)
 * Production-safe: Starts empty if no records are found.
 */
export async function loadExpenses(): Promise<Expense[]> {
  try {
    const idbData = await idbGet<Expense[]>(EXPENSES_KEY);
    if (Array.isArray(idbData)) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(EXPENSES_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed)) {
        idbSet(EXPENSES_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[financeStorage] Error loading expenses:', err);
  }

  return [];
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
 * Production-safe: Starts empty if no records are found.
 */
export async function loadInvoices(): Promise<Invoice[]> {
  try {
    const idbData = await idbGet<Invoice[]>(INVOICES_KEY);
    if (Array.isArray(idbData)) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(INVOICES_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed)) {
        idbSet(INVOICES_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[financeStorage] Error loading invoices:', err);
  }

  return [];
}

export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  if (!Array.isArray(invoices)) throw new Error('Invalid invoice data.');
  const storedInIdb = await idbSet(INVOICES_KEY, invoices);
  const storedLocally = safeSetLocalStorage(INVOICES_KEY, JSON.stringify(invoices));
  if (!storedInIdb && !storedLocally) throw new Error('Could not save invoices on this device.');
}

/**
 * Load Payments with dual persistence
 * Production-safe: Starts empty if no records are found.
 */
export async function loadPayments(): Promise<Payment[]> {
  try {
    const idbData = await idbGet<Payment[]>(PAYMENTS_KEY);
    if (Array.isArray(idbData)) {
      return idbData;
    }
    const lsData = safeGetLocalStorage(PAYMENTS_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed)) {
        idbSet(PAYMENTS_KEY, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[financeStorage] Error loading payments:', err);
  }

  return [];
}

export async function savePayments(payments: Payment[]): Promise<void> {
  if (!Array.isArray(payments)) throw new Error('Invalid payment data.');
  const storedInIdb = await idbSet(PAYMENTS_KEY, payments);
  const storedLocally = safeSetLocalStorage(PAYMENTS_KEY, JSON.stringify(payments));
  if (!storedInIdb && !storedLocally) throw new Error('Could not save payments on this device.');
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
    slips?: Payment['slips'];
    allocations?: Payment['allocations'];
  },
  invoices: Invoice[],
  payments: Payment[]
): { updatedInvoices: Invoice[]; updatedPayments: Payment[]; newPayment: Payment } {
  // 1. Business Logic Validation
  const targetInvoice = invoices.find((inv) => inv.id === params.invoiceId);
  if (!targetInvoice) {
    throw new Error('Invoice not found.');
  }

  const rawAmount = params.amount;
  if (typeof rawAmount !== 'number' || isNaN(rawAmount) || rawAmount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  // Calculate current paid amount for this invoice from existing payments
  const currentPaid = payments
    .filter((p) => p.invoiceId === targetInvoice.id || p.appliedInvoiceId === targetInvoice.id)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  // Historical invoices can have a paid balance without individual payment rows.
  const legacyPaid = Math.max(0, (targetInvoice.amountPaid || 0) - currentPaid);
  const currentBalanceDue = Math.max(0, targetInvoice.total - legacyPaid - currentPaid);

  if (rawAmount > currentBalanceDue) {
    throw new Error(
      `Payment cannot exceed the outstanding balance of ฿${currentBalanceDue.toLocaleString()}.`
    );
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  if (params.slips?.length && round(params.slips.reduce((sum, slip) => sum + slip.amount, 0)) !== round(rawAmount)) {
    throw new Error('Transfer slip amounts must equal the payment amount.');
  }
  if (params.allocations?.length && round(params.allocations.reduce((sum, line) => sum + line.amount, 0)) !== round(rawAmount)) {
    throw new Error('Payment line allocations must equal the payment amount.');
  }
  if (params.slips?.some((slip) => !Number.isFinite(slip.amount) || slip.amount <= 0)) {
    throw new Error('Each transfer slip must have a valid amount.');
  }
  const newSlipReferences = new Set<string>();
  for (const slip of params.slips || []) {
    if (slip.imageDataUrl && payments.some((payment) => payment.slips?.some((saved) => saved.imageDataUrl === slip.imageDataUrl))) {
      throw new Error('This transfer slip image was already recorded.');
    }
    const ref = slip.reference?.trim().toLowerCase();
    if (ref && newSlipReferences.has(ref)) throw new Error(`Duplicate transfer reference: ${slip.reference}`);
    if (ref) newSlipReferences.add(ref);
    if (ref && payments.some((payment) => payment.slips?.some((saved) => saved.reference?.trim().toLowerCase() === ref))) {
      throw new Error(`Transfer reference ${slip.reference} has already been recorded.`);
    }
  }
  for (const line of params.allocations || []) {
    if (!Number.isFinite(line.amount) || line.amount <= 0 ||
        (line.itemIndex !== -1 && !targetInvoice.items[line.itemIndex])) {
      throw new Error('Invalid invoice item allocation.');
    }
    if (line.itemIndex >= 0) {
      const prior = payments.filter((p) => p.invoiceId === targetInvoice.id)
        .flatMap((p) => p.allocations || []).filter((saved) => saved.itemIndex === line.itemIndex)
        .reduce((sum, saved) => sum + saved.amount, 0);
      if (round(prior + line.amount) > round(targetInvoice.items[line.itemIndex].amount)) {
        throw new Error(`Allocation exceeds invoice line: ${line.description}`);
      }
    }
  }

  const paymentDate = params.date || new Date().toISOString().slice(0, 10);
  const newPayment: Payment = {
    id: `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    invoiceId: params.invoiceId,
    jobId: params.jobId,
    customerId: params.customerId,
    date: paymentDate,
    amount: rawAmount,
    paymentMethod: params.paymentMethod,
    reference: params.reference?.trim() || '',
    notes: params.notes?.trim() || '',
    slips: params.slips,
    allocations: params.allocations,
    receiptNumber: `PTL-RC-${paymentDate.replace(/-/g, '')}-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
  };

  const nextPayments = [newPayment, ...payments];

  // Update target invoice
  const updatedInvoices = invoices.map((inv) => {
    if (inv.id !== params.invoiceId) return inv;

    // Calculate total paid across all payments for this invoice
      const invPayments = nextPayments.filter((p) => p.invoiceId === inv.id || p.appliedInvoiceId === inv.id);
    const totalPaid = legacyPaid + invPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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
