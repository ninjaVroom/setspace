import Link from 'next/link';
import Image from 'next/image';
import { categories, cities, type Post } from '@/lib/data';
import { localDate, WEST_TZ } from '@/lib/booking';
import { getCatalog } from '@/lib/db';
import { StudioCard } from '@/components/ui';
import { Switcher, SearchBar } from '@/components/client';
import { MapView } from '@/components/map';

export const dynamic = 'force-dynamic';

const catPhoto: Record<string, string> = { daylight: 'lumora', podcast: 'low-tide', film: 'ferro', workspace: 'atelier-row' };

export default async function Home() {
  const { studios, countBy, fromPrice, posts, studioBySlug } = await getCatalog();
  const items = categories.map((c) => {
    const s = studioBySlug(catPhoto[c.id])!;
    return { id: c.id, plural: c.plural, count: countBy('category', c.id), photo: s.photo, alt: s.alt };
  });
  const featured = studios.filter((s) => s.featured);
  const spot = studioBySlug('the-annex')!;
  return (
    <>
      <section className="hero container">
        <h1>Make space for great ideas.</h1>
        <p className="lede">Photo studios, podcast rooms and film sets, bookable by the hour.</p>
        <SearchBar cities={cities.map((c) => c.name)} today={localDate(WEST_TZ)} />
        <Switcher items={items} />
      </section>

      <section className="section container" aria-labelledby="rooms">
        <div className="section-head">
          <h2 id="rooms">This week&apos;s rooms</h2>
          <Link className="link" href="/explore">Explore all {studios.length}</Link>
        </div>
        <div className="rail">{featured.map((s) => <StudioCard key={s.slug} s={s} />)}</div>
      </section>

      <section className="section container" aria-labelledby="making">
        <div className="section-head"><h2 id="making">By what you&apos;re making</h2></div>
        <div className="tiles">
          {categories.map((c, i) => {
            const s = studioBySlug(['the-annex', 'low-tide', 'ferro', 'atelier-row'][i])!;
            return (
              <Link key={c.id} href={`/explore?category=${c.id}`} className="tile">
                <Image src={s.photo} alt="" fill sizes={i === 0 ? '66vw' : '33vw'} />
                <span className="tile-label"><strong>{c.plural}</strong><span className="mono small">{countBy('category', c.id)}</span></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section container" aria-labelledby="spot">
        <div className="section-head"><h2>One room, close</h2></div>
        <div className="spot">
          <div className="spot-photo"><Image src={spot.photo} alt={spot.alt} fill sizes="66vw" /></div>
          <div className="spot-card">
            <h3 id="spot">{spot.name}</h3>
            <p className="small" style={{ color: 'var(--color-band-muted)' }}>{spot.area}, {spot.city} {spot.postcode}</p>
            <p>{spot.space.join(' ')}</p>
            <p className="spec-line"><span>{spot.m2} m²</span><span>{spot.ceiling} m ceiling</span><span>{spot.capacity} ppl</span><span>${spot.hourly}/hr</span></p>
            <Link className="btn btn-commit btn-block" href={`/studios/${spot.slug}`}>See times for {spot.name}</Link>
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="city">
        <div className="section-head"><h2 id="city">Across Canada</h2><Link className="link" href="/explore">See every space on the map</Link></div>
        <div className="cities-split">
        <div className="cities">
          {cities.map((c) => (
            <Link key={c.name} href={`/explore?city=${encodeURIComponent(c.name)}`} className="city">
              <strong>{c.name}</strong>
              <span className="mono small">{countBy('city', c.name)} {countBy('city', c.name) === 1 ? 'space' : 'spaces'}</span>
              <span className="areas muted small">{c.areas}</span>
              <span className="mono small">from ${fromPrice(c.name)}/hr</span>
            </Link>
          ))}
        </div>
        <MapView className="map-wide" label="Map of Canada with the four cities we list in" bounds={[[42, -136], [62, -58]]}
          pins={cities.map((c) => ({ slug: c.name, lat: c.lat, lng: c.lng, label: `${c.name} ${countBy('city', c.name)}`, href: `/explore?city=${encodeURIComponent(c.name)}` }))} />
        </div>
      </section>

      <section className="section container" aria-labelledby="journal">
        <div className="section-head"><h2 id="journal">From the Journal</h2><Link className="link" href="/journal">All stories</Link></div>
        <div className="journal-teasers">
          <PostCard p={posts[0]} i={0} />
          <div><PostCard p={posts[1]} i={1} /><PostCard p={posts[2]} i={2} /></div>
        </div>
      </section>

      <section className="band" aria-labelledby="own">
        <div className="container">
          <div>
            <h2 id="own">Own a studio? Fill the empty hours.</h2>
            <p>List it free. You set the price, the hours and the rules.</p>
          </div>
          <Link className="btn btn-commit" href="/host">List your space</Link>
        </div>
      </section>
    </>
  );
}

function PostCard({ p, i }: { p: Post; i: number }) {
  return (
    <Link href={`/journal/${p.slug}`} className="post-card">
      <Image src={p.photo} alt="" width={900} height={600} sizes={i === 0 ? '66vw' : '33vw'} />
      <span className="muted small">{p.category}, {p.read} min read</span>
      <h3>{p.title}</h3>
    </Link>
  );
}
