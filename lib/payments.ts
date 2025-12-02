// Booking state changes and the Stripe calls behind them. Server only.
import Stripe from 'stripe';
import { getDb, getBooking, getCatalog, type Booking } from './db';
import { refundFor, zonedInstant } from './booking';

const key = process.env.STRIPE_SECRET_KEY;
if (key?.startsWith('sk_live')) throw new Error('SETSPACE is a demo: use Stripe test keys only.');
/** null when no keys are set; checkout then falls back to the built-in test-card stand-in. */
export const stripe = key ? new Stripe(key) : null;

const conflict = (e: unknown) => {
  for (let x = e as { code?: string; cause?: unknown } | undefined, i = 0; x && i < 5; x = x.cause as typeof x, i++) if (x.code === '23P01') return true;
  return false;
};

/** PaymentIntent for a fresh hold. Amount comes from the server's own price; request-to-book only authorises. */
export async function createIntent(b: { id: string; total: number; email?: string }, mode: 'instant' | 'request') {
  if (!stripe) return null;
  const pi = await stripe.paymentIntents.create({
    amount: b.total, currency: 'cad', receipt_email: b.email || undefined,
    capture_method: mode === 'request' ? 'manual' : 'automatic', automatic_payment_methods: { enabled: true },
    metadata: { bookingId: b.id },
  }, { idempotencyKey: `hold-${b.id}` });
  const db = await getDb();
  await db.update({ collection: 'bookings', id: Number(b.id), data: { stripePaymentIntentId: pi.id } });
  return pi.client_secret;
}

/**
 * Move a paid hold to confirmed (instant) or requested (request-to-book). Idempotent: the client return,
 * the confirmation page and the webhook can all call it. A hold that expired and lost its slot is refunded.
 */
export async function finalize(id: string, simulated = false): Promise<Booking | null> {
  const b = await getBooking(id);
  if (!b || (b.status !== 'hold' && b.status !== 'expired')) return b;
  const s = (await getCatalog()).studioById(b.studioId);
  if (!s) return b;
  let paid = simulated;
  if (!simulated) {
    if (!stripe || !b.pi) return b;
    const pi = await stripe.paymentIntents.retrieve(b.pi);
    paid = s.mode === 'request' ? pi.status === 'requires_capture' : pi.status === 'succeeded';
  }
  if (!paid) return b;
  const db = await getDb();
  try {
    await db.update({ collection: 'bookings', id: Number(id), data: { status: s.mode === 'instant' ? 'confirmed' : 'requested', holdExpiresAt: null } });
  } catch (e) {
    if (!conflict(e)) throw e;
    // Paid after the hold ran out and someone else took the slot: give the money back.
    if (stripe && b.pi) await (s.mode === 'request' ? stripe.paymentIntents.cancel(b.pi) : stripe.refunds.create({ payment_intent: b.pi }));
    await db.update({ collection: 'bookings', id: Number(id), data: { status: 'cancelled', refundAmount: b.total } });
  }
  return getBooking(id);
}

export class Refused extends Error { constructor(public status: number, msg: string) { super(msg); } }

/** Host answers a request: capture or release the card authorisation. */
export async function answerRequest(b: Booking, accept: boolean) {
  if (b.status !== 'requested') throw new Refused(409, 'bad_transition');
  if (stripe && b.pi) await (accept ? stripe.paymentIntents.capture(b.pi) : stripe.paymentIntents.cancel(b.pi));
  const db = await getDb();
  await db.update({ collection: 'bookings', id: Number(b.id), data: { status: accept ? 'confirmed' : 'cancelled' } });
}

/** Guest cancels: refund by the studio's tier and the 24-hour grace rule. */
export async function cancel(b: Booking) {
  if (b.status !== 'confirmed' && b.status !== 'requested') throw new Refused(409, 'bad_transition');
  const s = (await getCatalog()).studioById(b.studioId)!;
  const hoursBefore = (zonedInstant(b.date, b.start, b.tz).getTime() - Date.now()) / 3600e3;
  // An uncaptured request costs the guest nothing: release the whole authorisation.
  const refund = b.status === 'requested' ? b.total : refundFor(s.tier, b.total, hoursBefore, (Date.now() - b.created) / 3600e3);
  if (stripe && b.pi) {
    if (b.status === 'requested') await stripe.paymentIntents.cancel(b.pi);
    else if (refund > 0) await stripe.refunds.create({ payment_intent: b.pi, amount: refund }, { idempotencyKey: `cancel-${b.id}` });
  }
  const db = await getDb();
  await db.update({ collection: 'bookings', id: Number(b.id), data: { status: 'cancelled', refundAmount: refund } });
  return refund;
}
