import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { categories } from '@/lib/data';
import { localDate, addDays, weekday } from '@/lib/booking';
import { getCatalog, getDb, busyMap, freeSlots } from '@/lib/db';
import { StudioCard } from '@/components/ui';
import { BookingCard, FavButton, type Lite } from '@/components/client';
import { MapView } from '@/components/map';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = (await getCatalog()).studioBySlug((await params).slug);
  if (!s) return {};
  const cat = categories.find((c) => c.id === s.category)!.name.toLowerCase();
  return {
    title: `${s.name}, ${s.area}: ${s.m2} m² ${cat} from $${s.hourly}/hr`,
    description: `${s.m2} m² ${cat} in ${s.area} with a ${s.ceiling} m ceiling. Book from $${s.hourly}/hr, ${s.minHours} hr minimum.`,
  };
}

const tiers: Record<string, string> = {
  flexible: 'Full refund up to 24 hrs before.',
  moderate: 'Full refund up to 7 days before, half after that until 24 hrs before.',
  strict: 'Half refund up to 7 days before. No refund after.',
};

function Month({ first, today, selected, slug, full }: { first: string; today: string; selected: string; slug: string; full: (d: string) => boolean }) {
  const [y, m] = first.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pad = weekday(first);
  return (
    <div className="month">
      <h3>{new Date(first + 'T12:00:00Z').toLocaleDateString('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h3>
      <div className="month-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className="dow">{d}</span>)}
        {Array.from({ length: pad }, (_, i) => <span key={'p' + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = `${first.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;
          if (d < today) return <span key={d} className="day past">{i + 1}</span>;
          if (full(d)) return <span key={d} className="day full" title="Fully booked">{i + 1}<span className="sr"> fully booked</span></span>;
          return <a key={d} href={`/studios/${slug}?date=${d}#book`} aria-current={d === selected ? 'date' : undefined}>{i + 1}</a>;
        })}
      </div>
    </div>
  );
}

export default async function StudioPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string }> }) {
  const { studios, studioBySlug, reviewsFor, rating } = await getCatalog();
  const s = studioBySlug((await params).slug);
  if (!s) notFound();
  const today = localDate(s.tz);
  const q = await searchParams;
  const date = q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date) && q.date >= today ? q.date : addDays(today, 1);
  const r = rating(s.slug), revs = reviewsFor(s.slug);
  const lite: Lite = { slug: s.slug, name: s.name, hourly: s.hourly, minHours: s.minHours, discount8h: s.discount8h, cleaningFee: s.cleaningFee, mode: s.mode, open: s.open, close: s.close, tier: s.tier, capacity: s.capacity, host: s.host, photo: s.photo, city: s.city, province: s.province };
  const m1 = today.slice(0, 8) + '01';
  const m2 = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 1)).toISOString().slice(0, 10);
  const busy = await busyMap([s.id], today, addDays(m2, 31));
  const full = (d: string) => freeSlots(s, d, s.minHours, busy).length === 0;
  const hostSpaces = studios.filter((x) => x.host === s.host).length;
  const hostBookings = (await (await getDb()).count({ collection: 'bookings', where: { and: [{ studio: { in: studios.filter((x) => x.hostId === s.hostId).map((x) => x.id) } }, { status: { equals: 'completed' } }] } })).totalDocs;
  const similar = studios.filter((x) => x.slug !== s.slug && (x.category === s.category || x.city === s.city)).slice(0, 4);

  return (
    <div className="container">
      <div className="gallery">
        {s.gallery.map((src, i) => (
          <figure key={i}><Image src={src} alt={i === 0 ? s.alt : ''} fill sizes={i === 0 ? '60vw' : '20vw'} priority={i === 0} /></figure>
        ))}
      </div>

      <div className="detail">
        <div className="detail-main">
          <section>
            <div className="title-row">
              <div>
                <h1>{s.name}</h1>
                <p>{s.area}, {s.city} {s.postcode}{r && <>, rated {r} from {revs.length} demo {revs.length === 1 ? 'review' : 'reviews'}</>}</p>
              </div>
              <div style={{ position: 'relative', width: 44, height: 44 }}><FavButton slug={s.slug} name={s.name} /></div>
            </div>
            <div className="specs">
              <div><strong>{s.m2} m²</strong><span>Floor area</span></div>
              <div><strong>{s.ceiling} m</strong><span>Ceiling</span></div>
              <div><strong>{s.capacity} ppl</strong><span>Capacity</span></div>
              <div><strong>{s.light}</strong><span>Natural light</span></div>
              <div><strong>{s.minHours} hr</strong><span>Minimum</span></div>
            </div>
          </section>
          <section aria-labelledby="h-space">
            <h2 id="h-space">The space</h2>
            <div className="prose">{s.space.map((p, i) => <p key={i}>{p}</p>)}</div>
            <p className="pull">{s.pull}</p>
          </section>
          <section aria-labelledby="h-inc">
            <h2 id="h-inc">What&apos;s included</h2>
            <ul className="amenities">{s.included.map((a) => <li key={a}>{a}</li>)}</ul>
          </section>
          <section aria-labelledby="h-lit">
            <h2 id="h-lit">How it&apos;s lit</h2>
            <p className="prose">{s.lit}</p>
          </section>
          <section aria-labelledby="h-av">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <h2 id="h-av">Availability</h2><span className="muted small">Times in {s.city}. Struck-through days are full.</span>
            </div>
            <div className="months">
              <Month first={m1} today={today} selected={date} slug={s.slug} full={full} />
              <Month first={m2} today={today} selected={date} slug={s.slug} full={full} />
            </div>
          </section>
          <section aria-labelledby="h-rules" className="rules">
            <h2 id="h-rules">Rules</h2>
            {s.rules.map(([h, t]) => <details key={h}><summary>{h}</summary><p>{t}</p></details>)}
          </section>
          <section aria-labelledby="h-where">
            <h2 id="h-where">Where it is</h2>
            <p className="prose">{s.area}, {s.city} {s.postcode}. {s.transit} The exact address arrives with your confirmation.</p>
            <MapView className="map-area" label={`Map of ${s.area}, ${s.city}`} area={{ lat: s.lat, lng: s.lng, radius: 450 }} note={`Somewhere in this circle in ${s.area}`} />
          </section>
          {revs.length > 0 && (
            <section aria-labelledby="h-rev">
              <h2 id="h-rev">Rated {r} from {revs.length} {revs.length === 1 ? 'review' : 'reviews'}</h2>
              <div className="reviews">
                {revs.map((v) => (
                  <article className="review" key={v.author}>
                    <strong>{v.author}, {v.role}</strong>
                    <span className="muted small">{v.date}, demo review, {v.rating}/5</span>
                    <p>{v.body}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
          <section aria-labelledby="h-host">
            <h2 id="h-host">Hosted by {s.host}</h2>
            <p className="muted">{hostSpaces} {hostSpaces === 1 ? 'space' : 'spaces'} on SETSPACE, {hostBookings} completed bookings.</p>
          </section>
          <section aria-labelledby="h-can">
            <h2 id="h-can">Cancellation: {s.tier}</h2>
            <p className="prose">{tiers[s.tier]} Changed your mind? Cancel within 24 hrs of booking for a full refund, as long as the booking is more than 48 hrs away.</p>
          </section>
        </div>
        <BookingCard s={lite} initialDate={date} today={today} />
      </div>

      <section className="section" aria-labelledby="h-sim">
        <div className="section-head"><h2 id="h-sim">Similar spaces</h2><Link className="link" href={`/explore?category=${s.category}`}>See all</Link></div>
        <div className="rail">{similar.map((x) => <StudioCard key={x.slug} s={x} />)}</div>
      </section>
    </div>
  );
}
