import Link from 'next/link';
import Image from 'next/image';
import { categories, type Studio } from '@/lib/data';
import { getCatalog, currentUser } from '@/lib/db';
import { price, cad } from '@/lib/booking';
import { FavButton, ThemeToggle } from './client';

export async function Nav() {
  const [c, user] = await Promise.all([getCatalog(), currentUser()]);
  const host = user?.roles.includes('host');
  return (
    <div className="nav-wrap">
      <nav className="nav" aria-label="Main">
        <Link href="/" className="wordmark">SETSPACE</Link>
        <div className="nav-links">
          <Link href="/explore">Explore <span className="count">{c.studios.length}</span></Link>
          <Link href="/journal">Journal</Link>
          <Link href="/host">{host ? 'Host dashboard' : 'List your space'}</Link>
          {user ? <Link href="/account">{user.name.split(' ')[0]}</Link> : <Link href="/sign-in">Sign in</Link>}
        </div>
        <details className="nav-menu">
          <summary aria-label="Menu">Menu</summary>
          <div className="nav-sheet">
            <Link href="/explore">Explore</Link>
            <Link href="/journal">Journal</Link>
            <Link href="/host">List your space</Link>
            <Link href="/account">Your bookings</Link>
            <Link href="/help">Help</Link>
            {user ? <Link href="/account?view=settings">Account</Link> : <Link href="/sign-in">Sign in</Link>}
          </div>
        </details>
        <Link href="/explore" className="btn btn-commit">Book</Link>
      </nav>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-mark">SETSPACE</div>
            <p className="muted" style={{ marginTop: 12 }}>Extraordinary spaces. Remarkable ideas.</p>
            <p className="muted small" style={{ marginTop: 8 }}>Toronto, Montréal, Vancouver and Calgary. Prices in CAD.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              {categories.map((c) => <li key={c.id}><Link href={`/explore?category=${c.id}`}>{c.plural}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4>Hosts</h4>
            <ul>
              <li><Link href="/host">Host dashboard</Link></li>
              <li><Link href="/journal/pricing-quiet-hours">Pricing your quiet hours</Link></li>
              <li><Link href="/help">Hosting questions</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/case-study">How it&apos;s built</Link></li>
              <li><Link href="/journal">Journal</Link></li>
              <li><Link href="/help">Help</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="colophon">
          <p>Demo build. Studios, prices, bookings and reviews are seed data. Photographs are stand-ins. Map data from OpenStreetMap contributors. Set in Geist, Bodoni Moda and Geist Mono.</p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}

export async function StudioCard({ s, priority = false }: { s: Studio; priority?: boolean }) {
  const c = await getCatalog();
  const r = c.rating(s.slug);
  return (
    <article className="card" data-slug={s.slug}>
      <div className="card-photo">
        <Image src={s.photo} alt={s.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw" priority={priority} />
        <span className={s.mode === 'instant' ? 'tag tag-instant' : 'tag'}>{s.mode === 'instant' ? 'Instant book' : 'Request'}</span>
        <FavButton slug={s.slug} name={s.name} />
      </div>
      <div className="card-title">
        <Link href={`/studios/${s.slug}`}>{s.name}</Link>
        <span className="mono small">${s.hourly}/hr</span>
      </div>
      <div className="card-meta">
        <span className="muted">{s.area}, {s.city} {s.postcode}{r && <> rated {r} ({c.reviewsFor(s.slug).length})</>}</span>
        <span className="spec-line"><span>{s.m2} m²</span><span>{s.ceiling} m</span><span>{s.capacity} ppl</span><span>{s.light}</span></span>
        <span className="spec-line">{cad(price(s, 4).total)} for 4 hrs, {s.minHours} hr min</span>
      </div>
    </article>
  );
}

export function Photo({ src, alt, sizes = '100vw', priority = false }: { src: string; alt: string; sizes?: string; priority?: boolean }) {
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover' }} />;
}
