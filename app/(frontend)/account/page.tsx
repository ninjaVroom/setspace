import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { cad, hh, refundFor, localDate, zonedInstant, SITE_TZ } from '@/lib/booking';
import { getCatalog, currentUser, listBookings } from '@/lib/db';
import { StudioCard } from '@/components/ui';
import { SavedGrid, ThemeToggle, BookingAction, SignOut } from '@/components/client';

export const metadata = { title: 'Your account', robots: { index: false } };
export const dynamic = 'force-dynamic';

const label: Record<string, string> = { confirmed: 'Confirmed', requested: 'Requested', cancelled: 'Cancelled', completed: 'Completed' };

export default async function Account({ searchParams }: { searchParams: Promise<{ tab?: string; view?: string }> }) {
  const user = await currentUser();
  if (!user) redirect('/sign-in?next=/account');
  const { studios, studioBySlug } = await getCatalog();
  const q = await searchParams;
  const view = q.view === 'saved' || q.view === 'settings' ? q.view : 'bookings';
  const tab = q.tab === 'past' || q.tab === 'cancelled' ? q.tab : 'upcoming';
  const today = localDate(SITE_TZ);
  const mine = await listBookings({ and: [{ guest: { equals: user.id } }, { status: { not_in: ['hold', 'expired'] } }] });
  const rows = mine.filter((b) =>
    tab === 'cancelled' ? b.status === 'cancelled' : tab === 'past' ? b.status !== 'cancelled' && b.date < today : b.status !== 'cancelled' && b.date >= today,
  ).sort((a, b) => (tab === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));

  return (
    <div className="container shell">
      <nav className="rail-nav" aria-label="Account">
        <Link href="/account" aria-current={view === 'bookings' ? 'page' : undefined}>Bookings</Link>
        <Link href="/account?view=saved" aria-current={view === 'saved' ? 'page' : undefined}>Saved</Link>
        <Link href="/account?view=settings" aria-current={view === 'settings' ? 'page' : undefined}>Settings</Link>
      </nav>
      <div>
        <p className="muted small">Signed in as {user.name}</p>
        {view === 'bookings' && (
          <>
            <h1 style={{ fontSize: 'var(--text-display-m)' }}>Bookings</h1>
            <div className="tabs">
              {(['upcoming', 'past', 'cancelled'] as const).map((t) => (
                <Link key={t} className="chip" href={t === 'upcoming' ? '/account' : `/account?tab=${t}`} aria-current={tab === t}>{t[0].toUpperCase() + t.slice(1)}</Link>
              ))}
            </div>
            {rows.length === 0 ? (
              <div className="empty" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
                <div><h2>{tab === 'upcoming' ? 'No bookings coming up.' : `No ${tab} bookings.`}</h2><Link className="btn" href="/explore">Find a space</Link></div>
              </div>
            ) : (
              <div className="rows">
                {rows.map((b) => {
                  const s = studioBySlug(b.studio)!;
                  const hoursBefore = (zonedInstant(b.date, b.start, b.tz).getTime() - Date.now()) / 3600e3;
                  const refund = refundFor(s.tier, b.total, hoursBefore, (Date.now() - b.created) / 3600e3);
                  return (
                    <div className="row" key={b.id}>
                      <Image src={s.photo} alt="" width={192} height={192} />
                      <div>
                        <Link href={`/studios/${s.slug}`} className="serif">{s.name}</Link>
                        <div className="muted small">{new Date(b.date + 'T12:00:00Z').toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}, <span className="mono">{hh(b.start)} to {hh(b.start + b.hours)}</span></div>
                      </div>
                      <span className={`status status-${b.status}`}>{label[b.status]}</span>
                      <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
                        <span className="mono">{cad(b.total)}</span>
                        {tab === 'upcoming' && <><span className="muted small">Refund if cancelled now: {cad(refund)}</span><BookingAction id={b.id} action="cancel" label="Cancel" line /></>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {view === 'saved' && (
          <>
            <h1 style={{ fontSize: 'var(--text-display-m)', marginBottom: 32 }}>Saved</h1>
            <SavedGrid cards={Object.fromEntries(studios.map((s) => [s.slug, <StudioCard key={s.slug} s={s} />]))} />
          </>
        )}
        {view === 'settings' && (
          <>
            <h1 style={{ fontSize: 'var(--text-display-m)', marginBottom: 32 }}>Settings</h1>
            <div className="panel" style={{ maxWidth: 560 }}>
              <h2>Profile</h2>
              <p>{user.name}<br /><span className="muted">{user.email}</span></p>
              <h2>Appearance</h2>
              <ThemeToggle />
              <SignOut />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
