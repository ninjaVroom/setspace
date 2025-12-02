import { getDb, getBooking } from '@/lib/db';
import { stripe, finalize } from '@/lib/payments';

// Stripe to us. Signature checked on the raw body; each event id is stored once, so retries are no-ops.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return Response.json({ error: 'not_configured' }, { status: 501 });
  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') ?? '', secret);
  } catch {
    return Response.json({ error: 'bad_signature' }, { status: 400 });
  }
  const db = await getDb();
  try {
    await db.create({ collection: 'stripe-events', data: { eventId: event.id, type: event.type } });
  } catch {
    return Response.json({ received: true, duplicate: true });
  }
  if (event.type.startsWith('payment_intent.')) {
    const id = (event.data.object as { metadata?: { bookingId?: string } }).metadata?.bookingId;
    if (id) {
      if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.amount_capturable_updated') await finalize(id);
      if (event.type === 'payment_intent.canceled') {
        const b = await getBooking(id);
        if (b?.status === 'hold') await db.update({ collection: 'bookings', id: Number(id), data: { status: 'expired' } });
      }
    }
  }
  return Response.json({ received: true });
}
