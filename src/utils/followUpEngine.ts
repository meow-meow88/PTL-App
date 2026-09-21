import {
  InspectionJob,
  Invoice,
  RecurringService,
  RecurringFrequency,
  Task,
  Customer,
  Property,
  Vendor,
} from '../types';

/**
 * Calculates the next due date based on frequency from a base date (YYYY-MM-DD)
 */
export function calculateNextDueDate(
  baseDateStr: string = new Date().toISOString().slice(0, 10),
  frequency: RecurringFrequency,
  intervalDays: number = 14
): string {
  const baseDate = new Date(baseDateStr);
  if (isNaN(baseDate.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  const next = new Date(baseDate);

  switch (frequency) {
    case 'Weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'Every 2 Weeks':
      next.setDate(next.getDate() + 14);
      break;
    case 'Monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'Every 2 Months':
      next.setMonth(next.getMonth() + 2);
      break;
    case 'Quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'Custom':
      next.setDate(next.getDate() + (intervalDays > 0 ? intervalDays : 14));
      break;
    default:
      next.setDate(next.getDate() + 14);
      break;
  }

  return next.toISOString().slice(0, 10);
}

/**
 * Evaluates deterministic business rules and returns an updated list of tasks.
 * Prevents duplicates by deterministic task IDs (`${type}_${entityId}`).
 */
export function evaluateFollowUpRules(params: {
  existingTasks: Task[];
  invoices: Invoice[];
  jobs: InspectionJob[];
  recurringServices: RecurringService[];
  customers: Customer[];
  properties: Property[];
  vendors: Vendor[];
  currentDate?: string;
}): Task[] {
  const {
    existingTasks,
    invoices,
    jobs,
    recurringServices,
    customers,
    properties,
    vendors,
    currentDate = new Date().toISOString().slice(0, 10),
  } = params;

  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const taskMap = new Map<string, Task>();
  existingTasks.forEach((t) => taskMap.set(t.id, { ...t }));

  // Helper to add or keep task without duplicating
  const registerTask = (task: Task) => {
    if (!taskMap.has(task.id)) {
      taskMap.set(task.id, task);
    }
  };

  // -------------------------------------------------------------
  // RULE 1: IF Invoice is overdue AND balanceDue > 0
  // -> "Follow up overdue invoice"
  // -------------------------------------------------------------
  invoices.forEach((inv) => {
    if (inv.status === 'Paid' || inv.status === 'Cancelled' || inv.balanceDue <= 0) {
      // If task exists and was open, mark completed as condition is resolved
      const taskId = `invoice_overdue_${inv.id}`;
      const existing = taskMap.get(taskId);
      if (existing && existing.status === 'Open') {
        taskMap.set(taskId, {
          ...existing,
          status: 'Completed',
          completedAt: new Date().toISOString(),
        });
      }
      return;
    }

    const isOverdue =
      inv.status === 'Overdue' ||
      (inv.dueDate && new Date(inv.dueDate).getTime() < today.getTime());

    if (isOverdue) {
      const taskId = `invoice_overdue_${inv.id}`;
      const existing = taskMap.get(taskId);
      if (!existing) {
        const cust = customers.find((c) => c.id === inv.customerId);
        registerTask({
          id: taskId,
          type: 'invoice_overdue',
          title: `Follow up overdue invoice ${inv.invoiceNumber}`,
          description: `${cust?.name || 'Customer'} has an overdue balance of ฿${inv.balanceDue.toLocaleString()} (Due: ${inv.dueDate || 'N/A'}).`,
          customerId: inv.customerId,
          invoiceId: inv.id,
          jobId: inv.jobId,
          dueDate: inv.dueDate || todayStr,
          priority: 'Urgent',
          status: 'Open',
          source: 'system_rule',
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  // -------------------------------------------------------------
  // RULE 2: IF Quote has no response for >= 3 days
  // -> "Follow up quotation"
  // -------------------------------------------------------------
  jobs.forEach((job) => {
    if (
      job.status === 'Quoted' ||
      (job.quotation && job.quotation.refNo && job.status === 'Inspection')
    ) {
      const quoteDateStr =
        job.quotation?.date || job.createdAt?.slice(0, 10) || job.inspectionDate?.slice(0, 10);
      if (quoteDateStr) {
        const quoteDate = new Date(quoteDateStr);
        const diffDays = Math.floor(
          (today.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays >= 3) {
          const taskId = `quote_followup_${job.id}`;
          const existing = taskMap.get(taskId);
          if (!existing) {
            registerTask({
              id: taskId,
              type: 'quote_followup',
              title: `Follow up quotation for ${job.customerName}`,
              description: `Quotation sent ${diffDays} days ago for ${job.villaName || 'job'} with no response yet.`,
              customerId: job.customerId,
              propertyId: job.propertyId,
              jobId: job.id,
              dueDate: todayStr,
              priority: 'High',
              status: 'Open',
              source: 'system_rule',
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } else if (
      job.status === 'Approved' ||
      job.status === 'Scheduled' ||
      job.status === 'In Progress' ||
      job.status === 'Completed' ||
      job.status === 'Invoiced' ||
      job.status === 'Paid'
    ) {
      // Resolve any open quote follow-up
      const taskId = `quote_followup_${job.id}`;
      const existing = taskMap.get(taskId);
      if (existing && existing.status === 'Open') {
        taskMap.set(taskId, {
          ...existing,
          status: 'Completed',
          completedAt: new Date().toISOString(),
        });
      }
    }
  });

  // -------------------------------------------------------------
  // RULE 3: IF Job scheduled tomorrow (or today) AND confirmation != Confirmed
  // -> "Confirm appointment"
  // -------------------------------------------------------------
  jobs.forEach((job) => {
    if (job.status === 'Completed' || job.status === 'Cancelled') return;

    const jobDate = job.scheduledDate;
    const isTargetDate =
      jobDate === tomorrowStr ||
      jobDate === todayStr ||
      jobDate === 'Today' ||
      jobDate === 'Tomorrow';

    if (isTargetDate) {
      const isConfirmed = job.appointmentConfirmation === 'Confirmed';
      const taskId = `confirm_appointment_${job.id}`;
      const existing = taskMap.get(taskId);

      if (!isConfirmed) {
        if (!existing) {
          registerTask({
            id: taskId,
            type: 'confirm_appointment',
            title: `Confirm appointment: ${job.customerName}`,
            description: `Visit at ${job.villaName} scheduled for ${job.scheduledDate} ${job.scheduledTime || ''}. Customer has not confirmed yet.`,
            customerId: job.customerId,
            propertyId: job.propertyId,
            jobId: job.id,
            dueDate: jobDate === todayStr || jobDate === 'Today' ? todayStr : tomorrowStr,
            priority: 'High',
            status: 'Open',
            source: 'system_rule',
            createdAt: new Date().toISOString(),
          });
        }
      } else if (existing && existing.status === 'Open') {
        taskMap.set(taskId, {
          ...existing,
          status: 'Completed',
          completedAt: new Date().toISOString(),
        });
      }
    }
  });

  // -------------------------------------------------------------
  // RULE 4: IF Job status = Completed AND no Invoice exists
  // -> "Create invoice"
  // -------------------------------------------------------------
  jobs.forEach((job) => {
    if (job.status === 'Completed') {
      const hasInvoice = invoices.some((inv) => inv.jobId === job.id);
      const taskId = `create_invoice_${job.id}`;
      const existing = taskMap.get(taskId);

      if (!hasInvoice) {
        if (!existing) {
          registerTask({
            id: taskId,
            type: 'create_invoice',
            title: `Create invoice for completed job: ${job.villaName}`,
            description: `Work for ${job.customerName} is completed. Ready to issue and send invoice.`,
            customerId: job.customerId,
            propertyId: job.propertyId,
            jobId: job.id,
            dueDate: todayStr,
            priority: 'Normal',
            status: 'Open',
            source: 'system_rule',
            createdAt: new Date().toISOString(),
          });
        }
      } else if (existing && existing.status === 'Open') {
        taskMap.set(taskId, {
          ...existing,
          status: 'Completed',
          completedAt: new Date().toISOString(),
        });
      }
    }
  });

  // -------------------------------------------------------------
  // RULE 5: IF Recurring Service due within 3 days AND no future Job exists
  // -> "Schedule recurring service"
  // -------------------------------------------------------------
  recurringServices.forEach((service) => {
    if (service.status !== 'Active') return;

    const dueDate = new Date(service.nextDueDate);
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Due within 3 days or already overdue
    if (diffDays <= 3) {
      // Check whether a future open job already exists for this recurring service
      const hasFutureJob = jobs.some(
        (j) =>
          j.recurringServiceId === service.id &&
          j.status !== 'Completed' &&
          j.status !== 'Cancelled'
      );

      const taskId = `recurring_due_${service.id}`;
      const existing = taskMap.get(taskId);

      if (!hasFutureJob) {
        if (!existing) {
          const prop = properties.find((p) => p.id === service.propertyId);
          const cust = customers.find((c) => c.id === service.customerId);
          registerTask({
            id: taskId,
            type: 'recurring_due',
            title: `${service.serviceType} due in ${diffDays <= 0 ? 'today' : `${diffDays} days`}`,
            description: `${service.serviceType} for ${prop?.name || 'Property'} (${cust?.name || 'Customer'}) is due on ${service.nextDueDate}.`,
            customerId: service.customerId,
            propertyId: service.propertyId,
            dueDate: service.nextDueDate,
            priority: diffDays <= 1 ? 'High' : 'Normal',
            status: 'Open',
            source: 'system_rule',
            createdAt: new Date().toISOString(),
          });
        }
      } else if (existing && existing.status === 'Open') {
        taskMap.set(taskId, {
          ...existing,
          status: 'Completed',
          completedAt: new Date().toISOString(),
        });
      }
    }
  });

  // -------------------------------------------------------------
  // RULE 6: IF Job status = Waiting Vendor (or waitingOn === 'vendor')
  // -> "Follow up vendor"
  // -------------------------------------------------------------
  jobs.forEach((job) => {
    const isWaitingVendor =
      job.status === 'Waiting Vendor' || job.waitingOn === 'vendor';

    const taskId = `vendor_followup_${job.id}`;
    const existing = taskMap.get(taskId);

    if (isWaitingVendor && job.status !== 'Completed' && job.status !== 'Cancelled') {
      if (!existing) {
        const vendor = vendors.find((v) => v.id === job.vendorId);
        registerTask({
          id: taskId,
          type: 'vendor_followup',
          title: `Follow up vendor for ${job.villaName}`,
          description: `Job is waiting on ${vendor ? `${vendor.name} (${vendor.category})` : 'contractor'}. Check ETA or progress update.`,
          customerId: job.customerId,
          propertyId: job.propertyId,
          jobId: job.id,
          vendorId: job.vendorId,
          dueDate: todayStr,
          priority: 'Normal',
          status: 'Open',
          source: 'system_rule',
          createdAt: new Date().toISOString(),
        });
      }
    } else if (existing && existing.status === 'Open') {
      taskMap.set(taskId, {
        ...existing,
        status: 'Completed',
        completedAt: new Date().toISOString(),
      });
    }
  });

  return Array.from(taskMap.values());
}

/**
 * Handles completing a recurring job (e.g. Home Watch):
 * 1. Calculates the next due date for the recurring service.
 * 2. Updates the recurring service's lastCompletedDate and nextDueDate.
 * 3. If autoCreateJob is enabled:
 *    Safely creates the next Job, with strict DUPLICATE PREVENTION:
 *    - Never creates if a future open Job already exists for that recurring service.
 *    - Never creates if a Job with that scheduledDate already exists.
 */
export function processRecurringJobCompletion(params: {
  completedJob: InspectionJob;
  recurringServices: RecurringService[];
  jobs: InspectionJob[];
  customer?: Customer;
  property?: Property;
}): {
  updatedServices: RecurringService[];
  newJob?: InspectionJob;
} {
  const { completedJob, recurringServices, jobs, customer, property } = params;

  if (!completedJob.recurringServiceId) {
    return { updatedServices: recurringServices };
  }

  const targetService = recurringServices.find(
    (s) => s.id === completedJob.recurringServiceId
  );
  if (!targetService) {
    return { updatedServices: recurringServices };
  }

  const completionDate =
    completedJob.completedAt?.slice(0, 10) ||
    completedJob.scheduledDate ||
    new Date().toISOString().slice(0, 10);

  const nextDue = calculateNextDueDate(
    completionDate,
    targetService.frequency,
    targetService.interval
  );

  const updatedService: RecurringService = {
    ...targetService,
    lastCompletedDate: completionDate,
    nextDueDate: nextDue,
  };

  const updatedServices = recurringServices.map((s) =>
    s.id === targetService.id ? updatedService : s
  );

  // Check if autoCreateJob is enabled
  if (!targetService.autoCreateJob) {
    return { updatedServices };
  }

  // STRICT DUPLICATE PREVENTION:
  // 1. Check if an open/future job for this recurring service already exists
  const hasExistingOpenJob = jobs.some(
    (j) =>
      j.id !== completedJob.id &&
      j.recurringServiceId === targetService.id &&
      j.status !== 'Completed' &&
      j.status !== 'Cancelled'
  );

  if (hasExistingOpenJob) {
    console.info(
      `[RecurringJob] An open job already exists for service ${targetService.id}. Skipping duplicate creation.`
    );
    return { updatedServices };
  }

  // 2. Check if a job on the nextDueDate already exists for this property & service
  const hasJobOnDate = jobs.some(
    (j) =>
      j.recurringServiceId === targetService.id &&
      j.scheduledDate === nextDue
  );

  if (hasJobOnDate) {
    console.info(
      `[RecurringJob] A job already exists on ${nextDue} for service ${targetService.id}. Skipping duplicate creation.`
    );
    return { updatedServices };
  }

  // Create the next Job
  const timestamp = Date.now();
  const dateCompact = nextDue.replace(/-/g, '');
  const newJobId = `PTL-REC-${dateCompact}-${Math.floor(100 + Math.random() * 900)}`;

  const newJob: InspectionJob = {
    id: newJobId,
    clientId: completedJob.clientId || 'CL-REC',
    customerId: targetService.customerId,
    propertyId: targetService.propertyId,
    villaName: property?.name || completedJob.villaName || 'Villa Visit',
    customerName: customer?.name || completedJob.customerName || 'Client',
    customerGroup: completedJob.customerGroup || 'expat',
    propertyLocation: property?.area || completedJob.propertyLocation || 'Phuket',
    serviceType: targetService.serviceType,
    status: 'Scheduled',
    inspectionDate: nextDue,
    createdAt: new Date().toISOString(),
    inspector: completedJob.inspector || 'PTL Solo Operator',
    documentRef: newJobId,
    scheduledDate: nextDue,
    scheduledTime: completedJob.scheduledTime ? (completedJob.scheduledTime.includes('AM') || completedJob.scheduledTime.includes('PM') ? completedJob.scheduledTime.replace(/AM|PM/gi, '').trim() : completedJob.scheduledTime) : '10:00',
    appointmentConfirmation: 'Not Confirmed',
    recurringServiceId: targetService.id,
    price: targetService.price || completedJob.price || 0,
    isSimpleJob: true,
    waitingOn: 'none',
    requestDescription: `Scheduled recurring ${targetService.serviceType} (Frequency: ${targetService.frequency}). Notes: ${targetService.notes}`,
    notes: targetService.notes,
    items: [],
    quotation: {
      refNo: `QT-${newJobId}`,
      date: nextDue,
      inspectionRef: newJobId,
      validity: '30 Days',
      paymentTerm: 'Net 7 Days',
      hardwareItems: [],
      serviceItems: [
        {
          item: 1,
          description: targetService.serviceType,
          detail: `Recurring visit per schedule. ${targetService.notes || ''}`.trim(),
          estimatedSchedule: nextDue,
          qty: '1 Visit',
          amount: targetService.price,
        },
      ],
      procurementFeeRate: 0,
      terms: ['Payment due within 7 days of visit completion.'],
      contingencies: [],
    },
  };

  return {
    updatedServices,
    newJob,
  };
}

/**
 * Convenience wrapper to run deterministic follow up generation
 */
export function generateAutomatedFollowUps(
  jobs: InspectionJob[],
  existingTasks: Task[] = [],
  recurringServices: RecurringService[] = [],
  invoices: Invoice[] = [],
  customers: Customer[] = [],
  properties: Property[] = [],
  vendors: Vendor[] = []
): Task[] {
  return evaluateFollowUpRules({
    existingTasks,
    invoices,
    jobs,
    recurringServices,
    customers,
    properties,
    vendors,
  });
}
