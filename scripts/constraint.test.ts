// npm run test:db. Proves the exclusion constraint, not the app's pre-check, stops double bookings:
// both inserts skip createHold's availability check and race straight into Postgres.
import assert from 'node:assert/strict';
import { getPayload } from 'payload';
import config from '../payload.config';

const payload = await getPayload({ config });
const studio = (await payload.find({ collection: 'studios', limit: 1, where: { slug: { equals: 'ferro' } } })).docs[0];
assert.ok(studio, 'run npm run seed first');

// A day a year out, so the seed can't be in the way.
const day = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
const at = (h: number) => new Date(`${day}T${String(h).padStart(2, '0')}:00:00Z`).toISOString();
const row = (start: number, hours: number, status: 'hold' | 'confirmed' | 'cancelled' = 'hold') => ({
  studio: studio.id, guestName: 'Constraint test', start: at(start), end: at(start + hours), hours, status, total: 100, serviceFee: 10,
  holdExpiresAt: new Date(Date.now() + 6e5).toISOString(),
});
const code = (e: unknown) => { for (let x = e as { code?: string; cause?: unknown } | undefined; x; x = x.cause as typeof x) if (x.code) return x.code; };
const made: number[] = [];

try {
  const results = await Promise.allSettled([payload.create({ collection: 'bookings', data: row(10, 2) }), payload.create({ collection: 'bookings', data: row(10, 2) })]);
  for (const r of results) if (r.status === 'fulfilled') made.push(r.value.id);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1, 'exactly one parallel insert wins');
  const lost = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
  assert.equal(code(lost.reason), '23P01', 'the loser fails with exclusion_violation');

  // [) ranges: 12 to 14 touches 10 to 12 but does not overlap it.
  made.push((await payload.create({ collection: 'bookings', data: row(12, 2) })).id);
  // Cancelled rows don't block.
  made.push((await payload.create({ collection: 'bookings', data: row(10, 2, 'cancelled') })).id);
  // Overlap by one hour is refused.
  await assert.rejects(payload.create({ collection: 'bookings', data: row(11, 2, 'confirmed') }), (e) => code(e) === '23P01');
  console.log('ok: one winner, 23P01 for the loser, back-to-back allowed, cancelled ignored, partial overlap refused');
} finally {
  if (made.length) await payload.delete({ collection: 'bookings', where: { id: { in: made } } });
}
process.exit(0);
