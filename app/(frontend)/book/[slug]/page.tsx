import { notFound, redirect } from 'next/navigation';
import { localDate } from '@/lib/booking';
import { getCatalog, currentUser } from '@/lib/db';
import { Checkout } from '@/components/client';

export const metadata = { title: 'Your booking', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Book({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string; start?: string; hours?: string }> }) {
  const [c, user] = await Promise.all([getCatalog(), currentUser()]);
  const s = c.studioBySlug((await params).slug);
  if (!s) notFound();
  const q = await searchParams;
  const start = Number(q.start), hours = Number(q.hours);
  const ok = q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date) && q.date >= localDate(s.tz) && Number.isInteger(start) && Number.isInteger(hours) && hours >= s.minHours;
  if (!ok) redirect(`/studios/${s.slug}#book`);
  return <Checkout s={{ slug: s.slug, name: s.name, hourly: s.hourly, minHours: s.minHours, discount8h: s.discount8h, cleaningFee: s.cleaningFee, mode: s.mode, open: s.open, close: s.close, tier: s.tier, capacity: s.capacity, host: s.host, photo: s.photo, city: s.city, province: s.province }} date={q.date!} start={start} hours={hours}
    user={user ? { name: user.name, email: user.email } : null} stripeKey={process.env.STRIPE_SECRET_KEY ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null : null} />;
}
