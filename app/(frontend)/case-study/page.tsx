import Link from 'next/link';
import Image from 'next/image';
import { photos } from '@/lib/data';
import { TAX } from '@/lib/booking';
import { demoAccounts } from '@/lib/demo-accounts';
import { demoSignIn } from '../sign-in/actions';

export const metadata = {
  title: 'How it’s built',
  description: 'Case study: a studio-booking marketplace where Postgres refuses double bookings, every studio keeps its own time zone, and tax follows the province.',
};

const constraint = `ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    studio_id WITH =,
    tstzrange(start, "end", '[)') WITH &&
  )
  WHERE (status IN ('hold', 'requested', 'confirmed'));`;

const zones = `// Local wall-clock hour → UTC instant, in the studio's own zone.
// Two passes, so a DST jump between guess and answer is caught.
const wall  = Date.UTC(y, m, d, hour);
const first = wall - offset(tz, wall);
return new Date(wall - offset(tz, first));`;

const stack = [
  ['Next.js 15', 'App Router, server components, server actions for sign-in.'],
  ['Payload CMS 3', 'Runs inside the Next app: admin, auth, access rules, migrations.'],
  ['Postgres 17', 'The exclusion constraint, and the single source of truth.'],
  ['Stripe, test mode', 'Payment Element, manual capture for requests, refunds by policy.'],
  ['Leaflet + OpenStreetMap', 'Real maps, neighbourhood circles instead of door pins.'],
  ['Plain CSS', 'Tokens, light and dark, scroll-driven parallax with no script.'],
];

export default function CaseStudy() {
  return (
    <div className="case">
      <header className="case-hero container">
        <h1>One room, one booking.</h1>
        <p className="lede">How SETSPACE stops double bookings, keeps three time zones straight and adds the right tax.</p>
        <form action={demoSignIn} className="case-try">
          {demoAccounts.filter((a) => a.role !== 'admin').map((a, i) => (
            <button key={a.role} className={i === 0 ? 'btn btn-commit' : 'btn btn-line'} name="role" value={a.role} type="submit">Try it as the {a.role}</button>
          ))}
        </form>
      </header>

      <figure className="case-photo container"><Image src={photos.grip} alt="Lighting stands and flags lined up in a studio" width={1600} height={900} sizes="(max-width: 1440px) 100vw, 1344px" priority /></figure>

      <section className="case-row container" aria-labelledby="c1">
        <div>
          <h2 id="c1">The database says no.</h2>
          <p>Two people can press Pay on the same Saturday morning in the same second. Checking availability in the app first only narrows the gap; it never closes it.</p>
          <p>So Postgres holds the rule. An exclusion constraint refuses any two live bookings for one studio whose time ranges overlap. The loser of a race gets SQLSTATE 23P01, which the API turns into a 409 with the three nearest free slots.</p>
          <p className="muted small">Proved by <code>npm run test:db</code>: two parallel inserts, exactly one wins.</p>
        </div>
        <pre className="code" aria-label="The exclusion constraint"><code>{constraint}</code></pre>
      </section>

      <section className="case-row container" aria-labelledby="c2">
        <div>
          <h2 id="c2">A hold, not a lock.</h2>
          <p>Continuing to payment inserts a <em>hold</em> row that the constraint already guards. It lasts ten minutes. Stale holds flip to expired before the next insert, so no cron job is needed to free a slot.</p>
          <p>Request-to-book studios authorise the card and capture only when the host accepts.</p>
        </div>
        <StateDiagram />
      </section>

      <section className="case-row container" aria-labelledby="c3">
        <div>
          <h2 id="c3">Three time zones, one calendar.</h2>
          <p>Toronto and Montréal run on Eastern time, Calgary on Mountain, Vancouver on Pacific. Each studio stores its IANA zone; bookings are UTC instants, and every hour on screen is the studio&apos;s own local hour.</p>
          <p className="muted small">Unit tests cover spring-forward and fall-back days in each zone.</p>
        </div>
        <pre className="code" aria-label="Converting a local hour to UTC"><code>{zones}</code></pre>
      </section>

      <section className="case-row container" aria-labelledby="c4">
        <div>
          <h2 id="c4">Tax follows the province.</h2>
          <p>Prices are in Canadian dollars before tax. Checkout adds the studio province&apos;s sales tax on the booking and the service fee; hosts are paid the booking minus fee and tax.</p>
        </div>
        <table className="case-table">
          <thead><tr><th scope="col">Province</th><th scope="col">Tax</th></tr></thead>
          <tbody>
            {(Object.entries(TAX) as [string, { label: string }][]).map(([p, t]) => <tr key={p}><td>{({ ON: 'Ontario', QC: 'Québec', BC: 'British Columbia', AB: 'Alberta' } as Record<string, string>)[p]}</td><td className="mono">{t.label}</td></tr>)}
          </tbody>
        </table>
      </section>

      <section className="case-row container" aria-labelledby="c5">
        <div>
          <h2 id="c5">Who can see what.</h2>
          <p>Booking numbers run in order, so a guest&apos;s link carries a random token; without it, or the guest&apos;s or host&apos;s session, the page is a 404. The REST API never lets anyone create a booking, and sign-up can&apos;t grant itself a role.</p>
        </div>
        <ul className="case-stack">
          {stack.map(([h, t]) => <li key={h}><strong>{h}</strong><span className="muted small">{t}</span></li>)}
        </ul>
      </section>

      <section className="band" aria-labelledby="c6">
        <div className="container">
          <div>
            <h2 id="c6">Book a room and try to break it.</h2>
            <p>Every account, studio and booking is seed data. Stripe runs in test mode.</p>
          </div>
          <Link className="btn btn-commit" href="/explore">Find a space</Link>
        </div>
      </section>
    </div>
  );
}

function StateDiagram() {
  // Boxes and arrows for the booking lifecycle. Colours come from tokens so it follows the theme.
  const box = (x: number, y: number, label: string, strong = false) => (
    <g key={label}>
      <rect x={x} y={y} width="132" height="44" rx="2" fill={strong ? 'var(--color-signal)' : 'var(--color-surface)'} stroke="var(--color-ink)" />
      <text x={x + 66} y={y + 27} textAnchor="middle" fill={strong ? 'var(--color-on-signal)' : 'var(--color-ink)'}>{label}</text>
    </g>
  );
  const arrow = (d: string, label: string, lx: number, ly: number) => (
    <g key={d}>
      <path d={d} fill="none" stroke="var(--color-muted)" strokeWidth="1.5" markerEnd="url(#head)" />
      <text x={lx} y={ly} fill="var(--color-muted)" className="lbl">{label}</text>
    </g>
  );
  return (
    <svg className="diagram" viewBox="0 0 560 300" role="img" aria-label="Booking states: a hold becomes confirmed when an instant booking is paid, or requested when a request is authorised. A request becomes confirmed when the host accepts, or cancelled when declined. Confirmed bookings can be cancelled with a refund. Unpaid holds expire after ten minutes.">
      <defs><marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--color-muted)" /></marker></defs>
      {arrow('M146 60 H 404', 'paid, instant', 230, 50)}
      {arrow('M80 82 V 214', '10 min, unpaid', 88, 150)}
      {arrow('M146 60 Q 200 150 266 150', 'authorised', 170, 132)}
      {arrow('M398 150 Q 450 150 470 84', 'host accepts', 420, 128)}
      {arrow('M332 172 Q 360 236 404 236', 'declined', 330, 226)}
      {arrow('M470 84 V 214', 'refund by tier', 478, 170)}
      {box(14, 38, 'hold')}
      {box(404, 38, 'confirmed', true)}
      {box(266, 128, 'requested')}
      {box(14, 214, 'expired')}
      {box(404, 214, 'cancelled')}
    </svg>
  );
}
