import { getCatalog, slotsFor } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const s = (await getCatalog()).studioBySlug((await params).slug);
  if (!s) return Response.json({ error: 'not_found' }, { status: 404 });
  const q = new URL(req.url).searchParams;
  const date = q.get('date') ?? '';
  const hours = Math.min(16, Math.max(s.minHours, Number(q.get('hours')) || s.minHours));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: 'bad_date' }, { status: 400 });
  return Response.json({ date, hours, tz: s.tz, slots: await slotsFor(s, date, hours) });
}
