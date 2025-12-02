import { z } from 'zod';
import { getCatalog, currentUser, createHold, SlotTaken } from '@/lib/db';
import { createIntent } from '@/lib/payments';

const Hold = z.object({
  slug: z.string().max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.number().int().min(0).max(23),
  hours: z.number().int().min(1).max(16),
  guests: z.number().int().min(1).max(200),
  project: z.string().trim().min(1).max(80),
  note: z.string().max(600).default(''),
  name: z.string().trim().max(80).optional(),
  email: z.email().max(160).optional(),
});

export async function POST(req: Request) {
  const parsed = Hold.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid', issues: parsed.error.issues.map((i) => i.path.join('.')) }, { status: 400 });
  const b = parsed.data;
  const [c, user] = await Promise.all([getCatalog(), currentUser()]);
  const s = c.studioBySlug(b.slug);
  if (!s) return Response.json({ error: 'not_found' }, { status: 404 });
  if (b.guests > s.capacity) return Response.json({ error: 'invalid', issues: ['guests'] }, { status: 400 });
  const who = user ? { guestId: user.id, name: user.name, email: user.email } : b.name && b.email ? { name: b.name, email: b.email } : null;
  if (!who) return Response.json({ error: 'invalid', issues: ['name', 'email'] }, { status: 400 });
  try {
    const hold = await createHold(s, b.date, b.start, b.hours, who, { guests: b.guests, project: b.project, note: b.note });
    const clientSecret = await createIntent({ id: hold.id, total: hold.total, email: who.email }, s.mode);
    return Response.json({ ...hold, clientSecret }, { status: 201 });
  } catch (e) {
    if (e instanceof SlotTaken) return Response.json({ error: 'slot_taken', alternatives: e.alternatives }, { status: 409 });
    if ((e as Error).message === 'invalid') return Response.json({ error: 'invalid' }, { status: 400 });
    throw e;
  }
}
