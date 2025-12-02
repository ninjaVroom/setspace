import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { price, cad, hh, localDate, addDays, weekday, SITE_TZ } from '@/lib/booking';
import { getCatalog, currentUser, listBookings, type Booking, type Catalog } from '@/lib/db';
import { BookingAction } from '@/components/client';

export const metadata = { title: 'Host dashboard', robots: { index: false } };
export const dynamic = 'force-dynamic';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const payoutIn = (c: Catalog) => (b: Booking) => { const p = price(c.studioBySlug(b.studio)!, b.hours); return p.total - p.serviceFee - p.tax; };
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export default async function Host({ searchParams }: { searchParams: Promise<{ studio?: string }> }) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?next=/host');
  const c = await getCatalog();
  const { studioBySlug } = c;
  const payout = payoutIn(c);
  const q = await searchParams;
  const mineStudios = c.studios.filter((s) => s.hostId === user.id);
  const today = localDate(SITE_TZ);
  if (!mineStudios.length) return (
    <div className="container" style={{ paddingTop: 48, maxWidth: 720 }}>
      <h1 style={{ fontSize: 'var(--text-display-l)' }}>List your space.</h1>
      <p className="muted" style={{ marginTop: 12, fontSize: '1.125rem' }}>You have no live spaces yet, {user.name.split(' ')[0]}. Listing is free; you set the price, the hours and the rules.</p>
      <p className="small" style={{ marginTop: 24 }}>Hosts manage listings in the <Link className="link" href="/admin">studio admin</Link>. Ask us to turn on hosting for your account through <Link className="link" href="/contact">Contact</Link>.</p>
    </div>
  );
  const monday0 = addDays(today, -weekday(today));
  const all = await listBookings({ and: [{ studio: { in: mineStudios.map((s) => s.id) } }, { start: { greater_than_equal: addDays(monday0, -13 * 7) + 'T00:00:00Z' } }] });
  const paid = all.filter((b) => b.status === 'confirmed' || b.status === 'completed');
  const inRange = (from: number, to: number) => paid.filter((b) => b.date > addDays(today, from) && b.date <= addDays(today, to));

  // KPIs: last 30 days against the 30 before, all computed from the bookings table.
  const cur = inRange(-30, 0), prev = inRange(-60, -30);
  const openHours = mineStudios.reduce((a, s) => a + (s.close - s.open), 0) * 30;
  const occ = (l: Booking[]) => Math.round((l.reduce((a, b) => a + b.hours, 0) / openHours) * 100);
  const sum = (l: Booking[]) => l.reduce((a, b) => a + payout(b), 0);
  const avg = (l: Booking[]) => (l.length ? l.reduce((a, b) => a + b.hours, 0) / l.length : 0);
  const kpis = [
    ['Earnings, last 30 days', cad(sum(cur)), `${signed(pct(sum(cur), sum(prev)))}% on the 30 before`],
    ['Occupancy', `${occ(cur)}%`, `${signed(occ(cur) - occ(prev))} pts`],
    ['Bookings', String(cur.length), `${prev.length} the 30 before`],
    ['Avg. booking length', `${avg(cur).toFixed(1)} hrs`, `${avg(prev).toFixed(1)} hrs before`],
  ];

  const todayCount = paid.filter((b) => b.date === today).length;
  const requests = all.filter((b) => b.status === 'requested' && b.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  // Week view
  const studio = mineStudios.find((s) => s.slug === q.studio) ?? mineStudios[0];
  const monday = addDays(today, -weekday(today));
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const H0 = 8, H1 = 22, ROW = 28;
  const blocks = all.filter((b) => b.studio === studio.slug && week.includes(b.date) && (['confirmed', 'completed', 'requested'].includes(b.status) || (b.status === 'hold' && (b.expires ?? 0) > Date.now())));

  // Charts over the last 12 weeks
  const weeks = Array.from({ length: 12 }, (_, i) => addDays(monday, (i - 11) * 7));
  const revenue = weeks.map((w) => sum(paid.filter((b) => b.date >= w && b.date < addDays(w, 7))));
  const maxRev = Math.max(...revenue, 1);
  const hist = paid.filter((b) => b.date >= weeks[0] && b.date < today);
  const byDay = DAYS.map((_, d) => {
    const booked = hist.filter((b) => weekday(b.date) === d).reduce((a, b) => a + b.hours, 0);
    return Math.round((booked / (mineStudios.reduce((a, s) => a + s.close - s.open, 0) * 12)) * 100);
  });
  const heatHours = Array.from({ length: 12 }, (_, i) => 9 + i);
  const heat = heatHours.map((h) => DAYS.map((_, d) => hist.filter((b) => weekday(b.date) === d && b.start <= h && h < b.start + b.hours).length));
  const maxHeat = Math.max(...heat.flat(), 1);
  const peakDay = byDay.indexOf(Math.max(...byDay)), lowDay = byDay.indexOf(Math.min(...byDay));

  const W = 320, CH = 160;
  const pts = revenue.map((v, i) => `${(i / 11) * W},${CH - (v / maxRev) * CH}`).join(' ');

  return (
    <div className="container" style={{ paddingTop: 48 }}>
      <p className="muted small">Signed in as {user.name}. Payouts shown are test mode.</p>
      <h1 style={{ fontSize: 'var(--text-display-l)', marginTop: 8 }}>Good {Number(new Intl.DateTimeFormat('en-CA', { timeZone: SITE_TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date())) < 12 ? 'morning' : 'afternoon'}, {user.name.split(' ')[0]}.</h1>
      <p className="muted" style={{ marginTop: 12, fontSize: '1.125rem' }}>
        {todayCount} {todayCount === 1 ? 'booking' : 'bookings'} today. {requests.length} {requests.length === 1 ? 'request' : 'requests'} waiting. {mineStudios.length} live spaces.
      </p>

      <div className="kpis">
        {kpis.map(([l, v, d]) => <div className="kpi" key={l}><span className="small muted">{l}</span><strong>{v}</strong><span className="small muted">{d}</span></div>)}
      </div>

      <div className="dash">
        <section className="panel" aria-labelledby="h-week">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'baseline' }}>
            <h2 id="h-week">This week at {studio.name}</h2>
            <div className="actions">{mineStudios.map((s) => <Link key={s.slug} className="chip" href={`/host?studio=${s.slug}`} aria-current={s.slug === studio.slug}>{s.name}</Link>)}</div>
          </div>
          <div className="week">
            <span />
            {week.map((d) => <span key={d} className="dh">{DAYS[weekday(d)]} {Number(d.slice(8))}</span>)}
            <div className="hours">{Array.from({ length: H1 - H0 }, (_, i) => <span key={i}>{hh(H0 + i)}</span>)}</div>
            {week.map((d) => (
              <div className="col" key={d}>
                {Array.from({ length: H1 - H0 }, (_, i) => <div className="h" key={i} />)}
                {blocks.filter((b) => b.date === d).map((b) => (
                  <div key={b.id} className={`blk ${b.status === 'requested' ? 'blk-requested' : b.status === 'hold' ? 'blk-hold' : ''}`}
                    style={{ top: (Math.max(b.start, H0) - H0) * ROW, height: Math.min(b.hours, H1 - b.start) * ROW - 2 }}
                    title={`${b.guest}, ${hh(b.start)} to ${hh(b.start + b.hours)}`}>
                    {hh(b.start)} {b.status === 'requested' ? 'Request' : b.status === 'hold' ? 'Hold' : b.project}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="legend"><span><i />Booked</span><span><i className="req" />Request</span><span><i className="hold" />Checkout hold</span></div>
        </section>

        <section className="panel" aria-labelledby="h-req">
          <h2 id="h-req">Requests waiting</h2>
          {requests.length === 0 && <p className="muted">Nothing waiting. Requests expire after 24 hrs.</p>}
          {requests.slice(0, 3).map((b) => {
            const s = studioBySlug(b.studio)!;
            return (
              <article key={b.id} style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--color-rule)', paddingTop: 16 }}>
                <Image src={s.photo} alt="" width={600} height={300} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                <p><strong>{b.guest.split(' ')[0]}</strong> wants {s.name}, {new Date(b.date + 'T12:00:00Z').toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}, <span className="mono">{hh(b.start)} to {hh(b.start + b.hours)}</span>.</p>
                {b.note && <p className="muted small">“{b.note}”</p>}
                <p className="small">{b.guests} people. You receive <span className="mono">{cad(payout(b))}</span>.</p>
                <div className="actions"><BookingAction id={b.id} action="accept" label="Accept" /><BookingAction id={b.id} action="decline" label="Decline" line /></div>
              </article>
            );
          })}
          {requests.length > 3 && <p className="muted small">{requests.length - 3} more in the bookings list.</p>}
        </section>
      </div>

      <div className="dash-3">
        <section className="panel" aria-labelledby="h-rev">
          <h2 id="h-rev">12-week earnings</h2>
          <p className="muted small mono">{cad(revenue.reduce((a, b) => a + b, 0))} total</p>
          <svg className="chart" viewBox={`-40 -10 ${W + 50} ${CH + 30}`} role="img" aria-label={`Weekly earnings for 12 weeks, from ${cad(revenue[0])} to ${cad(revenue[11])}`}>
            {[0, 0.5, 1].map((t) => <g key={t}><line className="grid" x1="0" x2={W} y1={CH - t * CH} y2={CH - t * CH} /><text x="-6" y={CH - t * CH + 3} textAnchor="end">${Math.round((maxRev * t) / 100)}</text></g>)}
            <polyline className="line" points={pts} />
            <circle className="now" cx={W} cy={CH - (revenue[11] / maxRev) * CH} r="5" />
            <text x="0" y={CH + 18}>12 wks ago</text><text x={W} y={CH + 18} textAnchor="end">This week</text>
          </svg>
        </section>
        <section className="panel" aria-labelledby="h-occ">
          <h2 id="h-occ">Weekday occupancy</h2>
          <p className="muted small">Share of open hours booked, last 12 weeks</p>
          <svg className="chart" viewBox="0 -14 280 190" role="img" aria-label={DAYS.map((d, i) => `${d} ${byDay[i]}%`).join(', ')}>
            {byDay.map((v, i) => {
              const h = (v / Math.max(...byDay, 1)) * 150;
              return <g key={i}><rect className={i === peakDay ? 'bar-hi' : 'bar'} x={i * 40 + 6} y={150 - h} width="28" height={h} /><text x={i * 40 + 20} y={150 - h - 4} textAnchor="middle">{v}%</text><text x={i * 40 + 20} y="168" textAnchor="middle">{DAYS[i]}</text></g>;
            })}
          </svg>
          <p className="small">{DAYS[lowDay]} is your quietest day at {byDay[lowDay]}%. A four-hour morning bundle could fill it.</p>
        </section>
        <section className="panel" aria-labelledby="h-heat">
          <h2 id="h-heat">Hour-of-day demand</h2>
          <p className="muted small">Bookings covering each hour, last 12 weeks</p>
          <div className="heat" role="img" aria-label="Heat map of bookings by weekday and hour">
            <span />{DAYS.map((d) => <span key={d} style={{ textAlign: 'center' }}>{d[0]}</span>)}
            {heat.map((row, i) => [<span key={'h' + i}>{hh(heatHours[i])}</span>, ...row.map((v, d) => <i key={i + '-' + d} style={{ opacity: 0.08 + (v / maxHeat) * 0.92 }} title={`${v}`} />)])}
          </div>
        </section>
      </div>
    </div>
  );
}
