import assert from 'node:assert/strict';
import test from 'node:test';
import type { InspectionJob } from '../src/types';
import { getDominantJobState, getPrimaryJobAction } from '../src/utils/serviceWorkflow';

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
});
