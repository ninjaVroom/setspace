// npm run seed: wipes and reseeds the demo database. Deterministic, so the dashboard charts keep their shape.
import { getPayload } from 'payload';
import { sql } from '@payloadcms/db-postgres';
import config from '../payload.config';
import { studios, reviews, posts, faqs } from './seed-data';
import { demoAccounts, otherHosts, DEMO_PASSWORD } from '../lib/demo-accounts';
import { price, computeSlots, overlaps, localDate, addDays, weekday, zonedInstant, SITE_TZ } from '../lib/booking';

const payload = await getPayload({ config });
const db = payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } };
await db.drizzle.execute(sql`TRUNCATE users, studios, bookings, reviews, posts, faqs, stripe_events, payload_preferences, payload_locked_documents RESTART IDENTITY CASCADE`);

const users = new Map<string, number>();
for (const a of [...demoAccounts, ...otherHosts.map((h) => ({ ...h, role: 'host' as const }))]) {
  const u = await payload.create({ collection: 'users', data: { email: a.email, name: a.name, password: a.role === 'admin' && process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD : DEMO_PASSWORD, roles: a.role === 'admin' ? ['admin'] : a.role === 'host' ? ['host', 'guest'] : ['guest'] } });
  users.set(a.name, u.id);
}

const ids = new Map<string, number>();
for (const s of studios) {
  const d = await payload.create({
    collection: 'studios',
    data: {
      slug: s.slug, name: s.name, owner: users.get(s.host)!, status: 'live', featured: s.featured, category: s.category, city: s.city, area: s.area, postcode: s.postcode,
      province: s.province, timezone: s.tz as 'America/Toronto', lat: s.lat, lng: s.lng, photo: s.photo, gallery: s.gallery.map((src) => ({ src })), alt: s.alt, hourly: s.hourly, minHours: s.minHours, discount8h: s.discount8h,
      cleaningFee: s.cleaningFee, m2: s.m2, ceiling: s.ceiling, capacity: s.capacity, light: s.light, mode: s.mode, tier: s.tier, open: s.open, close: s.close,
      blurb: s.blurb, space: s.space.join('\n\n'), pull: s.pull, lit: s.lit, included: s.included.map((item) => ({ item })),
      rules: s.rules.map(([title, text]) => ({ title, text })), transit: s.transit,
    },
  });
  ids.set(s.slug, d.id);
}
for (const r of reviews) await payload.create({ collection: 'reviews', data: { ...r, studio: ids.get(r.studio)!, status: 'published' } });
for (const p of posts) await payload.create({ collection: 'posts', data: { ...p, body: p.body.join('\n\n'), studios: p.studios.map((s) => ids.get(s)!) } });
for (const [i, f] of faqs.entries()) await payload.create({ collection: 'faqs', data: { ...f, order: i } });

// Bookings: 84 days back, 14 ahead, busier at weekends.
type Row = { studio: string; guest: string; guestId?: number; date: string; start: number; hours: number; guests: number; project: string; note?: string; status: 'requested' | 'confirmed' | 'cancelled' | 'completed'; created: number };
let r = 7;
const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
const names = ['Sam Villers', 'Élodie Tremblay', 'Kofi Mensah', 'Ruth Abara', 'Leo Park', 'Nadia Haddad', 'Owen MacLeod', 'Priya Sandhu'];
const projects = ['Lookbook', 'Portrait session', 'Product shoot', 'Podcast recording', 'Music video', 'Table read', 'Editorial'];
const today = localDate(SITE_TZ);
const rows: Row[] = [];
for (const s of studios) {
  for (let d = -84; d <= 14; d++) {
    const date = addDays(today, d);
    const busyChance = [0.35, 0.3, 0.45, 0.4, 0.65, 0.75, 0.45][weekday(date)];
    const taken: { start: number; hours: number }[] = [];
    for (let k = 0; k < 2; k++) {
      if (rnd() > busyChance) continue;
      const hours = s.minHours + Math.floor(rnd() * 3);
      const free = computeSlots(s.open, s.close, hours, taken);
      if (!free.length) continue;
      const start = free[Math.min(free.length - 1, Math.floor(rnd() * Math.min(free.length, 7)))];
      taken.push({ start, hours });
      const status = d < 0 ? (rnd() < 0.06 ? 'cancelled' : 'completed') : s.mode === 'request' && rnd() < 0.3 ? 'requested' : 'confirmed';
      rows.push({ studio: s.slug, guest: names[Math.floor(rnd() * names.length)], date, start, hours, guests: 2 + Math.floor(rnd() * Math.min(10, s.capacity - 1)),
        project: projects[Math.floor(rnd() * projects.length)], status, created: Date.now() + (d - 10) * 864e5 });
    }
  }
}
// One request for Maya to answer, on Saturday next week.
const sat = addDays(today, 7 + ((5 - weekday(today) + 7) % 7));
for (const b of rows) if (b.studio === 'hollow-room' && b.date === sat) b.status = 'cancelled';
rows.push({ studio: 'hollow-room', guest: 'Sam Villers', date: sat, start: 13, hours: 4, guests: 6, project: 'Portrait session',
  note: 'Portraits for a weekend magazine. Quiet crew of 6, no catering or haze.', status: 'requested', created: Date.now() - 6 * 3600e3 });
// The demo guest's own history.
const me = demoAccounts[0];
for (const [slug, d, start, hours, status] of [['lumora', 12, 10, 4, 'confirmed'], ['low-tide', -20, 11, 2, 'completed'], ['the-annex', -45, 13, 3, 'cancelled']] as const) {
  const date = addDays(today, d);
  for (const b of rows) if (b.studio === slug && b.date === date && overlaps(b, { start, hours })) b.status = 'cancelled';
  rows.push({ studio: slug, guest: me.name, guestId: users.get(me.name), date, start, hours, guests: 4, project: 'Lookbook', status, created: Date.now() + (d - 14) * 864e5 });
}

const bySlug = new Map(studios.map((s) => [s.slug, s]));
for (let i = 0; i < rows.length; i += 10) {
  await Promise.all(rows.slice(i, i + 10).map((b) => {
    const s = bySlug.get(b.studio)!;
    const p = price(s, b.hours);
    return payload.create({
      collection: 'bookings',
      data: {
        studio: ids.get(b.studio)!, guest: b.guestId, guestName: b.guest, guestEmail: b.guestId ? me.email : undefined,
        start: zonedInstant(b.date, b.start, s.tz).toISOString(), end: zonedInstant(b.date, b.start + b.hours, s.tz).toISOString(), hours: b.hours, guests: b.guests,
        project: b.project, note: b.note, status: b.status, total: p.total, serviceFee: p.serviceFee, createdAt: new Date(b.created).toISOString(),
      },
    });
  }));
}
console.log(`Seeded ${users.size} users, ${ids.size} studios, ${reviews.length} reviews, ${posts.length} posts, ${faqs.length} faqs, ${rows.length} bookings.`);
process.exit(0);
