import { test } from 'node:test';
import assert from 'node:assert/strict';
import { price, overlaps, computeSlots, refundFor, zonedInstant, zonedParts, cad, hh } from './booking.ts';

const lumora = { hourly: 85, minHours: 2, discount8h: 15, cleaningFee: 0, province: 'ON' as const };

test('Ontario: 4 hrs x $85 + 10% fee + 13% HST', () => {
  // 340 + 34 fee = 374, HST 48.62
  assert.deepEqual(price(lumora, 4), { subtotal: 34000, discount: 0, cleaning: 0, serviceFee: 3400, tax: 4862, total: 42262 });
  assert.equal(cad(42262), '$422.62');
});

test('8+ hours takes the full-day discount before the fee and tax', () => {
  const p = price(lumora, 8); // 680 - 102 = 578, fee 57.80, HST on 635.80 = 82.65
  assert.equal(p.discount, 10200);
  assert.equal(p.total, 63580 + 8265);
});

test('Québec charges GST + QST; Alberta and BC charge GST only', () => {
  assert.equal(price({ ...lumora, hourly: 95, province: 'QC' }, 2).tax, 3130); // 14.975% of 209.00
  assert.equal(price({ ...lumora, province: 'AB' }, 4).tax, 1870); // 5% of 374.00
  assert.equal(price({ ...lumora, province: 'BC' }, 4).tax, 1870);
});

test('half-open ranges: back-to-back bookings do not collide', () => {
  assert.equal(overlaps({ start: 10, hours: 2 }, { start: 12, hours: 2 }), false);
  assert.equal(overlaps({ start: 10, hours: 3 }, { start: 12, hours: 2 }), true);
});

test('slots skip busy time and respect closing', () => {
  assert.deepEqual(computeSlots(8, 14, 2, [{ start: 10, hours: 2 }]), [8, 12]);
  assert.deepEqual(computeSlots(8, 9, 2, []), []);
});

test('refund tiers and grace period', () => {
  assert.equal(refundFor('flexible', 19800, 30, 100), 19800);
  assert.equal(refundFor('flexible', 19800, 10, 100), 0);
  assert.equal(refundFor('moderate', 19800, 48, 100), 9900);
  assert.equal(refundFor('strict', 19800, 200, 100), 9900);
  assert.equal(refundFor('strict', 19800, 72, 2), 19800);
});

test('local hours map to the right UTC instant in each zone, across DST', () => {
  assert.equal(zonedInstant('2026-01-15', 10, 'America/Toronto').toISOString(), '2026-01-15T15:00:00.000Z'); // EST
  assert.equal(zonedInstant('2026-07-15', 10, 'America/Toronto').toISOString(), '2026-07-15T14:00:00.000Z'); // EDT
  assert.equal(zonedInstant('2026-03-08', 7, 'America/Toronto').toISOString(), '2026-03-08T11:00:00.000Z'); // spring-forward day
  assert.equal(zonedInstant('2026-03-08', 7, 'America/Vancouver').toISOString(), '2026-03-08T14:00:00.000Z'); // guess lands before the change
  assert.equal(zonedInstant('2026-11-01', 7, 'America/Vancouver').toISOString(), '2026-11-01T15:00:00.000Z'); // fall-back day
  assert.equal(zonedInstant('2026-07-10', 10, 'America/Edmonton').toISOString(), '2026-07-10T16:00:00.000Z'); // MDT
  assert.deepEqual(zonedParts('2026-07-15T14:00:00.000Z', 'America/Toronto'), { date: '2026-07-15', hour: 10 });
  assert.deepEqual(zonedParts('2026-07-16T02:00:00.000Z', 'America/Vancouver'), { date: '2026-07-15', hour: 19 });
});

test('12-hour clock labels', () => {
  assert.deepEqual([0, 9, 12, 13, 23].map(hh), ['12 am', '9 am', '12 pm', '1 pm', '11 pm']);
});
