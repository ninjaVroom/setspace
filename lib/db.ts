// Server-only data access. Pages and route handlers read Postgres through Payload's local API.
import { getPayload, type Where } from 'payload';
import config from '@payload-config';
import { headers } from 'next/headers';
import { cache } from 'react';
import type { Studio, Review, Post, Category } from './data';
import { price, computeSlots, localDate, zonedInstant, zonedParts, addDays, type Range, type Province } from './booking';

export const getDb = () => getPayload({ config });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
const paras = (s?: string) => (s ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number));

const toStudio = (d: Doc): Studio => ({
  id: d.id, slug: d.slug, name: d.name, category: d.category as Category, city: d.city, area: d.area, postcode: d.postcode, province: d.province as Province, tz: d.timezone,
  photo: d.photo, gallery: (d.gallery ?? []).map((g: Doc) => g.src), alt: d.alt,
  hourly: d.hourly, minHours: d.minHours, discount8h: d.discount8h ?? 0, cleaningFee: d.cleaningFee ?? 0,
  m2: d.m2, ceiling: d.ceiling, capacity: d.capacity, light: d.light, mode: d.mode, tier: d.tier, open: d.open, close: d.close,
  host: typeof d.owner === 'object' ? d.owner?.name ?? '' : '', hostId: idOf(d.owner), featured: !!d.featured,
  lat: Number(d.lat), lng: Number(d.lng), blurb: d.blurb, space: paras(d.space), pull: d.pull ?? '', lit: d.lit ?? '',
  included: (d.included ?? []).map((i: Doc) => i.item), rules: (d.rules ?? []).map((r: Doc) => [r.title, r.text] as [string, string]), transit: d.transit ?? '',
});

/** Everything public, loaded once per request. */
export const getCatalog = cache(async () => {
  const db = await getDb();
  const [s, r, p, f] = await Promise.all([
    db.find({ collection: 'studios', where: { status: { equals: 'live' } }, depth: 1, pagination: false, sort: 'createdAt' }),
    db.find({ collection: 'reviews', where: { status: { equals: 'published' } }, depth: 0, pagination: false, sort: 'createdAt' }),
    db.find({ collection: 'posts', depth: 0, pagination: false, sort: 'createdAt' }),
    db.find({ collection: 'faqs', depth: 0, pagination: false, sort: 'order' }),
  ]);
  const studios = (s.docs as Doc[]).map(toStudio);
  const slugOf = new Map(studios.map((x) => [x.id, x.slug]));
  const reviews: Review[] = (r.docs as Doc[]).map((d) => ({ studio: slugOf.get(idOf(d.studio)) ?? '', author: d.author, role: d.role ?? '', rating: d.rating, date: d.date, body: d.body }));
  const posts: Post[] = (p.docs as Doc[]).map((d) => ({
    slug: d.slug, title: d.title, standfirst: d.standfirst, category: d.category, date: d.date, read: d.read, photo: d.photo, author: d.author,
    body: paras(d.body), studios: (d.studios ?? []).map((x: unknown) => slugOf.get(idOf(x))).filter(Boolean) as string[],
  }));
  const faqs = (f.docs as Doc[]).map((d) => ({ group: d.group as string, q: d.q as string, a: d.a as string }));
  const studioBySlug = (slug: string) => studios.find((x) => x.slug === slug);
  const reviewsFor = (slug: string) => reviews.filter((x) => x.studio === slug);
  return {
    studios, reviews, posts, faqs, studioBySlug, reviewsFor,
    studioById: (id: number) => studios.find((x) => x.id === id),
    countBy: (k: 'category' | 'city', v: string) => studios.filter((x) => x[k] === v).length,
    fromPrice: (city: string) => Math.min(...studios.filter((x) => x.city === city).map((x) => x.hourly)),
    rating: (slug: string) => { const l = reviewsFor(slug); return l.length ? (l.reduce((a, b) => a + b.rating, 0) / l.length).toFixed(1) : null; },
  };
});
export type Catalog = Awaited<ReturnType<typeof getCatalog>>;

export type User = { id: number; name: string; email: string; roles: ('guest' | 'host' | 'admin')[] };
/** The signed-in user from the Payload cookie, or null. */
export const currentUser = cache(async () => {
  const db = await getDb();
  const { user } = await db.auth({ headers: await headers() });
  return (user as unknown as User) ?? null;
});

// Bookings ------------------------------------------------------------------

export type Status = 'hold' | 'requested' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
export type Booking = {
  id: string; studio: string; studioId: number; guestId: number | null; guest: string; email: string;
  date: string; start: number; hours: number; guests: number; project: string; note: string; status: Status;
  total: number; serviceFee: number; created: number; expires?: number; pi?: string; refund?: number; token: string; tz: string;
};

const toBooking = (d: Doc, studioOf: (id: number) => Studio | undefined): Booking => {
  const s = studioOf(idOf(d.studio));
  const tz = s?.tz ?? 'America/Toronto';
  const { date, hour } = zonedParts(d.start, tz);
  return {
    id: String(d.id), studio: s?.slug ?? '', tz, studioId: idOf(d.studio), guestId: d.guest ? idOf(d.guest) : null,
    guest: d.guestName, email: d.guestEmail ?? '', date, start: hour, hours: d.hours, guests: d.guests ?? 1, project: d.project ?? '', note: d.note ?? '',
    status: d.status, total: d.total, serviceFee: d.serviceFee, created: new Date(d.createdAt).getTime(),
    expires: d.holdExpiresAt ? new Date(d.holdExpiresAt).getTime() : undefined, pi: d.stripePaymentIntentId ?? undefined, refund: d.refundAmount ?? undefined, token: d.accessToken ?? '',
  };
};

export async function listBookings(where: Where) {
  const [db, c] = await Promise.all([getDb(), getCatalog()]);
  const r = await db.find({ collection: 'bookings', where, depth: 0, pagination: false, sort: 'start' });
  return (r.docs as Doc[]).map((d) => toBooking(d, c.studioById));
}

export async function getBooking(id: string) {
  if (!/^\d+$/.test(id)) return null;
  const [db, c] = await Promise.all([getDb(), getCatalog()]);
  const d = await db.findByID({ collection: 'bookings', id: Number(id), depth: 0, disableErrors: true });
  return d ? toBooking(d as Doc, c.studioById) : null;
}

export async function updateBooking(id: string, data: Doc) {
  const db = await getDb();
  await db.update({ collection: 'bookings', id: Number(id), data });
}

/** What blocks a slot: confirmed, requested, and holds that haven't run out. Same set the exclusion constraint guards. */
const blocking = (): Where => ({ or: [{ status: { in: ['requested', 'confirmed'] } }, { and: [{ status: { equals: 'hold' } }, { holdExpiresAt: { greater_than: new Date().toISOString() } }] }] });

/** Busy ranges keyed `${studioId}|${date}` for local dates `from`..`to` inclusive, each studio in its own zone. One query. */
export async function busyMap(studioIds: number[], from: string, to: string, except?: string) {
  const [db, c] = await Promise.all([getDb(), getCatalog()]);
  // A day either side in UTC covers every Canadian zone; rows outside the range land on keys nobody reads.
  const r = await db.find({
    collection: 'bookings', depth: 0, pagination: false, select: { studio: true, start: true, hours: true },
    where: { and: [{ studio: { in: studioIds } }, { start: { greater_than_equal: addDays(from, -1) + 'T00:00:00Z' } }, { start: { less_than: addDays(to, 2) + 'T00:00:00Z' } }, blocking(), ...(except ? [{ id: { not_equals: Number(except) } }] : [])] },
  });
  const m = new Map<string, Range[]>();
  for (const d of r.docs as Doc[]) {
    const { date, hour } = zonedParts(d.start, c.studioById(idOf(d.studio))?.tz ?? 'America/Toronto');
    const k = `${idOf(d.studio)}|${date}`;
    m.set(k, [...(m.get(k) ?? []), { start: hour, hours: d.hours }]);
  }
  return m;
}

/** Free start hours, with past hours removed today. */
export function freeSlots(s: Studio, date: string, hours: number, busy: Map<string, Range[]>) {
  const today = localDate(s.tz);
  if (date < today) return [];
  const now = zonedParts(new Date(), s.tz).hour;
  return computeSlots(s.open, s.close, hours, busy.get(`${s.id}|${date}`) ?? []).filter((h) => date > today || h > now);
}

export async function slotsFor(s: Studio, date: string, hours: number) {
  return freeSlots(s, date, hours, await busyMap([s.id], date, date));
}

export class SlotTaken extends Error { constructor(public alternatives: { date: string; start: number }[]) { super('slot_taken'); } }

async function alternatives(s: Studio, date: string, hours: number) {
  const busy = await busyMap([s.id], date, addDays(date, 13));
  const out: { date: string; start: number }[] = [];
  for (let d = 0; d < 14 && out.length < 3; d++) {
    const day = addDays(date, d);
    for (const h of freeSlots(s, day, hours, busy)) if (out.length < 3) out.push({ date: day, start: h });
  }
  return out;
}

const pgCode = (e: unknown): string | undefined => {
  for (let x = e as { code?: string; cause?: unknown } | undefined, i = 0; x && i < 5; x = x.cause as typeof x, i++) if (x.code) return x.code;
};

export const HOLD_MS = 10 * 60e3;

/** The single write path for new bookings. The app checks first for a friendly answer; the exclusion constraint settles races. */
export async function createHold(s: Studio, date: string, start: number, hours: number, who: { guestId?: number; name: string; email?: string }, details: { guests: number; project: string; note: string }) {
  if (!Number.isInteger(start) || !Number.isInteger(hours) || hours < s.minHours || start < s.open || start + hours > s.close) throw new Error('invalid');
  if (!(await slotsFor(s, date, hours)).includes(start)) throw new SlotTaken(await alternatives(s, date, hours));
  const db = await getDb();
  const now = new Date();
  // Stale holds still sit inside the constraint until flipped; flip this studio's before inserting.
  await db.update({ collection: 'bookings', where: { and: [{ studio: { equals: s.id } }, { status: { equals: 'hold' } }, { holdExpiresAt: { less_than: now.toISOString() } }] }, data: { status: 'expired' } });
  const p = price(s, hours);
  const token = crypto.randomUUID();
  try {
    const d = await db.create({
      collection: 'bookings',
      data: {
        studio: s.id, guest: who.guestId, guestName: who.name, guestEmail: who.email, start: zonedInstant(date, start, s.tz).toISOString(), end: zonedInstant(date, start + hours, s.tz).toISOString(),
        hours, guests: details.guests, project: details.project, note: details.note, accessToken: token, status: 'hold', total: p.total, serviceFee: p.serviceFee, holdExpiresAt: new Date(now.getTime() + HOLD_MS).toISOString(),
      },
    });
    return { id: String(d.id), token, expires: now.getTime() + HOLD_MS, total: p.total };
  } catch (e) {
    if (pgCode(e) === '23P01') throw new SlotTaken(await alternatives(s, date, hours));
    throw e;
  }
}
