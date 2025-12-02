import { z } from 'zod';
import { getBooking, getCatalog, currentUser } from '@/lib/db';
import { finalize, answerRequest, cancel, stripe, Refused } from '@/lib/payments';

const Body = z.object({ action: z.enum(['pay', 'accept', 'decline', 'cancel']), token: z.string().max(64).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 });
  const { action, token } = parsed.data;
  const [b, user, c] = await Promise.all([getBooking((await params).id), currentUser(), getCatalog()]);
  if (!b) return Response.json({ error: 'not_found' }, { status: 404 });
  const s = c.studioById(b.studioId);
  const isGuest = (!!token && token === b.token) || (!!user && user.id === b.guestId);
  const isHost = !!user && (user.id === s?.hostId || user.roles.includes('admin'));
  try {
    if (action === 'pay') {
      if (!isGuest) return Response.json({ error: 'forbidden' }, { status: 403 });
      // Without Stripe keys the client-side test-card check stands in for payment; only then does the server take its word.
      if (!stripe && (b.status !== 'hold' || (b.expires ?? 0) < Date.now())) return Response.json({ error: 'hold_expired' }, { status: 410 });
      const done = await finalize(b.id, !stripe);
      if (done?.status === 'hold') return Response.json({ error: 'not_paid' }, { status: 402 });
      return Response.json({ id: b.id, status: done?.status });
    }
    if (action === 'accept' || action === 'decline') {
      if (!isHost) return Response.json({ error: 'forbidden' }, { status: 403 });
      await answerRequest(b, action === 'accept');
      return Response.json({ id: b.id, status: action === 'accept' ? 'confirmed' : 'cancelled' });
    }
    if (!isGuest && !isHost) return Response.json({ error: 'forbidden' }, { status: 403 });
    const refund = await cancel(b);
    return Response.json({ id: b.id, status: 'cancelled', refund });
  } catch (e) {
    if (e instanceof Refused) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
