import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { categories, cities, photos, type Studio } from '@/lib/data';
import { localDate, WEST_TZ } from '@/lib/booking';
import { MapView } from '@/components/map';
import { getCatalog, busyMap, freeSlots } from '@/lib/db';
import { StudioCard } from '@/components/ui';

type Q = { [k: string]: string | undefined };
export async function generateMetadata({ searchParams }: { searchParams: Promise<Q> }): Promise<Metadata> {
  const q = await searchParams;
  const c = categories.find((x) => x.id === q.category);
  return { title: `${c?.plural ?? 'Studios'} in ${q.city || 'Canada'}`, robots: Object.keys(q).length > 2 ? { index: false } : undefined };
}

const sorts: Record<string, [string, (a: Studio, b: Studio) => number]> = {
  recommended: ['Recommended', (a, b) => Number(b.featured) - Number(a.featured)],
  price_asc: ['Price, low to high', (a, b) => a.hourly - b.hourly],
  price_desc: ['Price, high to low', (a, b) => b.hourly - a.hourly],
  largest: ['Largest', (a, b) => b.m2 - a.m2],
};

export default async function Explore({ searchParams }: { searchParams: Promise<Q> }) {
  const q = await searchParams;
  const { studios } = await getCatalog();
  const max = Number(q.price) || 0, cap = Number(q.cap) || 0, text = (q.q ?? '').toLowerCase().trim();
  const date = q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date) ? q.date : '';
  const busy = date ? await busyMap(studios.map((s) => s.id), date, date) : new Map();
  const list = studios
    .filter((s) => !q.category || s.category === q.category)
    .filter((s) => !q.city || s.city === q.city)
    .filter((s) => !max || s.hourly <= max)
    .filter((s) => !cap || s.capacity >= cap)
    .filter((s) => !q.instant || s.mode === 'instant')
    .filter((s) => !text || text.split(/\s+/).some((w) => w.length > 2 && `${s.name} ${s.category} ${s.blurb} ${s.area} ${s.included.join(' ')} ${s.space.join(' ')}`.toLowerCase().includes(w)))
    .filter((s) => !date || freeSlots(s, date, s.minHours, busy).length > 0)
    .sort((sorts[q.sort ?? ''] ?? sorts.recommended)[1]);

  const cat = categories.find((c) => c.id === q.category);
  const view = q.view === 'list' ? 'list' : 'split';
  const link = (patch: Q) => '/explore?' + new URLSearchParams(Object.entries({ ...q, ...patch }).filter(([, v]) => v) as [string, string][]).toString();
  const applied = [q.price, q.cap, q.instant, q.date, q.q].filter(Boolean).length;
  // One city: a pin per studio. Several: a pin per city, since a Toronto street block is a single pixel at country zoom.
  const inCities = cities.filter((c) => list.some((s) => s.city === c.name));
  const pins = inCities.length > 1
    ? inCities.map((c) => { const n = list.filter((s) => s.city === c.name).length; return { slug: c.name, lat: c.lat, lng: c.lng, label: `${c.name} ${n}`, href: link({ city: c.name }) }; })
    : list.map((s) => ({ slug: s.slug, lat: s.lat, lng: s.lng, label: `${s.hourly}`, name: s.name, href: `/studios/${s.slug}` }));
  // Hovering a card lights its pin, with no script: one :has() rule per visible studio.
  const pinCss = list.map((s) => `.split:has(.card[data-slug="${s.slug}"]:hover) .pin[data-slug="${s.slug}"]{background:var(--color-signal);color:var(--color-on-signal);z-index:3}`).join('');

  return (
    <>
      <div className="filterbar">
        <form className="container" action="/explore">
          <Link className="chip" href={link({ category: undefined })} aria-current={!q.category}>All</Link>
          {categories.map((c) => <Link key={c.id} className="chip" href={link({ category: c.id })} aria-current={q.category === c.id}>{c.plural}</Link>)}
          <span className="sep" />
          {q.category && <input type="hidden" name="category" value={q.category} />}
          {q.q && <input type="hidden" name="q" value={q.q} />}
          <label className="sr" htmlFor="f-city">City</label>
          <select id="f-city" className="input" name="city" defaultValue={q.city ?? ''}><option value="">All cities</option>{cities.map((c) => <option key={c.name}>{c.name}</option>)}</select>
          <label className="sr" htmlFor="f-date">Date</label>
          <input id="f-date" className="input" type="date" name="date" defaultValue={date} min={localDate(WEST_TZ)} />
          <label className="sr" htmlFor="f-price">Max price</label>
          <select id="f-price" className="input" name="price" defaultValue={q.price ?? ''}><option value="">Any price</option>{[75, 100, 150, 250].map((p) => <option key={p} value={p}>Under ${p}/hr</option>)}</select>
          <label className="sr" htmlFor="f-cap">People</label>
          <select id="f-cap" className="input" name="cap" defaultValue={q.cap ?? ''}><option value="">Any size</option>{[4, 8, 12, 20].map((p) => <option key={p} value={p}>{p}+ people</option>)}</select>
          <label className="check"><input type="checkbox" name="instant" value="1" defaultChecked={!!q.instant} />Instant book</label>
          <label className="sr" htmlFor="f-sort">Sort</label>
          <select id="f-sort" className="input" name="sort" defaultValue={q.sort ?? ''}>{Object.entries(sorts).map(([k, [l]]) => <option key={k} value={k === 'recommended' ? '' : k}>{l}</option>)}</select>
          <input type="hidden" name="view" value={q.view ?? ''} />
          <button className="btn" type="submit" style={{ minHeight: 36 }}>Apply{applied ? ` (${applied})` : ''}</button>
          <Link className="chip" href={link({ view: view === 'list' ? undefined : 'list' })} style={{ marginLeft: 'auto' }}>{view === 'list' ? 'Show map' : 'List only'}</Link>
        </form>
      </div>

      <div className="container">
        <header className="page-head">
          <h1>{cat ? cat.plural : 'Explore'}</h1>
          <p>{list.length} {list.length === 1 ? 'space' : 'spaces'}{q.city ? ` in ${q.city}` : ''}{max ? `, under $${max}/hr` : ''}{date ? `, free on ${new Date(date + 'T12:00:00Z').toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}` : ''}</p>
        </header>

        {list.length === 0 ? (
          <>
            <div className="empty">
              <Image src={photos.plaster} alt="An empty plaster room" width={1200} height={750} />
              <div>
                <h2>No rooms match all of that.</h2>
                <p>Try a wider date range or remove a filter.</p>
                <Link className="btn" href="/explore">Clear filters</Link>
              </div>
            </div>
            <h2 style={{ fontSize: 'var(--text-h3)', marginBottom: 24 }}>Close to what you asked for</h2>
            <div className="grid-cards">{[...new Set(studios.filter((s) => !q.category || s.category === q.category).concat(studios))].slice(0, 3).map((s) => <StudioCard key={s.slug} s={s} />)}</div>
          </>
        ) : (
          <div className="split" data-view={view}>
            <style dangerouslySetInnerHTML={{ __html: pinCss }} />
            <div className="grid-cards">{list.map((s, i) => <StudioCard key={s.slug} s={s} priority={i < 2} />)}</div>
            <MapView pins={pins} label={`Map of ${q.city || 'Canada'}`} note="Neighbourhoods, not addresses. The exact address arrives with your booking." />
          </div>
        )}
      </div>
    </>
  );
}
