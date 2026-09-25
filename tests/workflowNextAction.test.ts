import assert from 'node:assert/strict';
import test from 'node:test';
import type { InspectionJob, RecurringService } from '../src/types';
import { getDominantJobState, getPrimaryJobAction, createDefaultHomeInspectionChecklist,
  isHomeWatchService, isHomeInspectionService, getLocalizedServiceName } from '../src/utils/serviceWorkflow';
import { generateHomeWatchSchedule } from '../src/utils/homeWatchSchedule';
import { processRecurringJobCompletion } from '../src/utils/followUpEngine';

const job = (changes: Partial<InspectionJob> = {}): InspectionJob => ({
  id: 'test-job',
  serviceType: 'Property Visit',
  status: 'New',
  quotation: { serviceItems: [], hardwareItems: [] },
  ...changes,
} as InspectionJob);

test('a scheduled visit without customer approval still needs a quote', () => {
  const item = job({ status: 'Scheduled', scheduledDate: '2026-10-01', appointmentConfirmation: 'Confirmed' });
  assert.equal(getPrimaryJobAction(item, 'th').type, 'create_quote');
});

test('a new urgent roadside job offers a quick quote before dispatch', () => {
  const item = job({ serviceType: 'Roadside / Tire Assistance', urgency: 'Urgent' });
  assert.equal(getPrimaryJobAction(item, 'th').label, 'ทำใบเสนอราคาด่วน');
});

test('a new Home Watch package starts with a quotation', () => {
  assert.equal(getPrimaryJobAction(job({ serviceType: 'Home Watch' }), 'th').type, 'create_quote');
});

test('the three property services remain distinct in the Thai interface', () => {
  assert.equal(getLocalizedServiceName('Home Watch', 'th'), 'Home Watch');
  assert.equal(getLocalizedServiceName('Property Visit', 'th'), 'Property Visit');
  assert.equal(getLocalizedServiceName('Home Inspection', 'th'), 'Home Inspection');
  assert.equal(isHomeWatchService('Home Inspection', job({ homeWatchChecklist: createDefaultHomeInspectionChecklist() })), false);
  assert.equal(isHomeInspectionService('Home Inspection'), true);
  assert.ok(createDefaultHomeInspectionChecklist().length > 16);
});

test('technical fault-finding quotes the visit before diagnosis', () => {
  const item = job({ serviceType: 'CCTV', jobPurpose: 'FAULT_FINDING' });
  assert.equal(getPrimaryJobAction(item, 'th').type, 'create_inspection_quote');
});

test('a prepared quote is sent rather than starting field work', () => {
  const item = job({ quotation: { serviceItems: [{ amount: 1200 }], hardwareItems: [] } as InspectionJob['quotation'] });
  assert.equal(getPrimaryJobAction(item, 'th').type, 'send_quote');
});

test('a sent quote asks for the actual customer response', () => {
  const item = job({ status: 'Waiting Approval', quoteSentAt: '2026-09-25T01:00:00Z' });
  assert.equal(getPrimaryJobAction(item, 'th').type, 'record_customer_response');
});

test('approval with a required material advance waits for the advance', () => {
  const item = job({ status: 'Approved', customerApprovedAt: '2026-09-25T01:00:00Z', materialDepositRequested: 2000 });
  assert.equal(getPrimaryJobAction(item, 'th').type, 'record_deposit');
});

test('approval without a date routes to scheduling', () => {
  const item = job({ status: 'Approved', customerApprovedAt: '2026-09-25T01:00:00Z' });
  assert.equal(getPrimaryJobAction(item, 'th').type, 'schedule_job');
});

test('a confirmed appointment can start field work', () => {
  const item = job({ status: 'Approved', customerApprovedAt: '2026-09-25T01:00:00Z', scheduledDate: '2026-10-01', appointmentConfirmation: 'Confirmed' });
  assert.equal(getPrimaryJobAction(item, 'th').type, 'start_job');
});

test('finished field work waiting on payment stays actionable', () => {
  const item = job({ status: 'Completed', completedAt: '2026-09-25T01:00:00Z', waitingOn: 'payment' });
  assert.equal(getDominantJobState(item, 'th').key, 'waiting_payment');
  assert.equal(getPrimaryJobAction(item, 'th').type, 'create_invoice_collect');
});

test('a declined quote leaves the active workflow', () => {
  assert.equal(getDominantJobState(job({ status: 'Cancelled' }), 'th').key, 'cancelled');
  assert.equal(getPrimaryJobAction(job({ status: 'Cancelled' }), 'th').type, 'open_job');
});

test('an undecided customer with a follow-up date remains in the response stage', () => {
  const item = job({ status: 'Waiting Customer', waitingOn: 'customer', nextFollowUpDate: '2026-10-01' });
  assert.equal(getPrimaryJobAction(item, 'th').type, 'record_customer_response');
});

test('a two-visit Home Watch plan creates the next visit after completion and stops after the second', () => {
  const first = job({ id: 'visit-1', serviceType: 'Home Watch', scheduledDate: '2026-10-01', scheduledTime: '10:00',
    recurringServiceId: 'plan-1', status: 'Completed', completedAt: '2026-10-01T12:00:00Z',
    customerApprovedAt: '2026-09-28T01:00:00Z' });
  const schedule = generateHomeWatchSchedule('2026-10-01', '10:00', 'Every 2 Weeks', 2);
  assert.deepEqual(schedule.map((visit) => visit.scheduledDate), ['2026-10-01', '2026-10-15']);
  const plan = { id: 'plan-1', status: 'Active', planType: 'finite', totalVisits: 2, completedVisits: 0,
    customerId: 'cust-1', propertyId: 'villa-1', serviceType: 'Home Watch', frequency: 'Every 2 Weeks',
    nextDueDate: '2026-10-01', autoCreateJob: true, price: 1500,
    visitSchedule: schedule.map((visit, index) => index === 0 ? { ...visit, jobId: first.id } : visit) } as RecurringService;
  const firstResult = processRecurringJobCompletion({ completedJob: first, recurringServices: [plan], jobs: [first] });
  assert.equal(firstResult.newJob?.scheduledDate, '2026-10-15');
  assert.equal(firstResult.newJob?.customerApprovedAt, first.customerApprovedAt);
  assert.equal(firstResult.newJob?.homeWatchChecklist?.some((item) => item.id === 'hw_elec_fans'), true);
  assert.equal(firstResult.updatedServices[0].completedVisits, 1);
  const second = { ...firstResult.newJob!, status: 'Completed' as const, completedAt: '2026-10-15T12:00:00Z' };
  const lastResult = processRecurringJobCompletion({ completedJob: second, recurringServices: firstResult.updatedServices, jobs: [first, second] });
  assert.equal(lastResult.newJob, undefined);
  assert.equal(lastResult.updatedServices[0].completedVisits, 2);
  assert.equal(lastResult.updatedServices[0].status, 'Completed');
});
