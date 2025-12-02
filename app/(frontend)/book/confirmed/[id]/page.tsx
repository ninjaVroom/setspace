import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getBooking, getCatalog, currentUser } from '@/lib/db';
import { finalize } from '@/lib/payments';
import { cad, hh } from '@/lib/booking';

export const metadata = { title: 'Booking confirmed', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Confirmed({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ id }, { t }, user, c] = await Promise.all([params, searchParams, currentUser(), getCatalog()]);
  let b = await getBooking(id);
  // Ids are sequential, so the page needs the link secret, the guest's own session, or the host's.
  const s0 = b && c.studioById(b.studioId);
  if (!b || !s0 || !((t && t === b.token) || (user && (user.id === b.guestId || user.id === s0.hostId)))) notFound();
  // Back from a Stripe redirect before the webhook landed: settle it now.
  if (b.status === 'hold' && b.pi) b = (await finalize(b.id)) ?? b;
  if (b.status === 'hold') return <div className="container confirmed"><div><h1>Confirming your payment.</h1><p className="muted">This takes a few seconds. Refresh the page if it doesn&apos;t update.</p></div></div>;
  if (b.status === 'expired') notFound();
  const s = s0;
  const request = b.status === 'requested';
  const day = new Date(b.date + 'T12:00:00Z').toLocaleDateString('en-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const stamp = (h: number) => b.date.replaceAll('-', '') + 'T' + String(h).padStart(2, '0') + '0000';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SETSPACE//EN', 'BEGIN:VEVENT', `UID:${b.id}@setspace`, `DTSTART;TZID=${s.tz}:${stamp(b.start)}`,
    `DTEND;TZID=${s.tz}:${stamp(b.start + b.hours)}`, `SUMMARY:${s.name}`, `LOCATION:${s.area}\, ${s.city} ${s.postcode}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return (
    <div className="container confirmed">
      <div>
        <h1>{request ? 'Request sent.' : "You're booked."}</h1>
        <p className="muted" style={{ marginBottom: 32 }}>{request ? `${s.host} has 24 hrs to accept. Your card is authorised, not charged.` : `${s.name} is yours. The address and door code are below.`}</p>
        <dl className="facts">
          <dt>Studio</dt><dd>{s.name}</dd>
          <dt>Date</dt><dd>{day}</dd>
          <dt>Time</dt><dd className="mono">{hh(b.start)} to {hh(b.start + b.hours)}</dd>
          <dt>People</dt><dd>{b.guests}</dd>
          <dt>Where</dt><dd>{request ? `${s.area}, ${s.city}. The address arrives when ${s.host} accepts.` : `${s.area}, ${s.city} ${s.postcode}. Door code arrives 24 hrs before.`}</dd>
          <dt>Total</dt><dd className="mono">{cad(b.total)}</dd>
          <dt>Reference</dt><dd className="mono">{b.id}</dd>
        </dl>
        <div className="actions" style={{ marginTop: 32 }}>
          {!request && <a className="btn btn-commit" href={'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics)} download={`${s.slug}.ics`}>Add to calendar</a>}
          <Link className="btn btn-line" href="/account">{request ? 'View request' : 'View booking'}</Link>
        </div>
      </div>
      <Image src={s.photo} alt={s.alt} width={900} height={1125} />
    </div>
  );
}
