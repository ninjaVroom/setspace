'use client';
import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { price, cad, hh, TAX, type Province } from '@/lib/booking';
import { signIn, signOut, type AuthState } from '@/app/(frontend)/sign-in/actions';

// ---------- small storage helpers: every read and write may throw in private mode ----------
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function ThemeToggle() {
  const [mode, setMode] = useState('system');
  useEffect(() => { try { setMode(localStorage.getItem('theme') || 'system'); } catch {} }, []);
  const pick = (m: string) => {
    setMode(m);
    try { m === 'system' ? localStorage.removeItem('theme') : localStorage.setItem('theme', m); } catch {}
    if (m === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = m;
  };
  return (
    <div className="seg" role="group" aria-label="Appearance">
      {['light', 'dark', 'system'].map((m) => (
        <button key={m} type="button" aria-pressed={mode === m} onClick={() => pick(m)}>{m[0].toUpperCase() + m.slice(1)}</button>
      ))}
    </div>
  );
}

export function FavButton({ slug, name }: { slug: string; name: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(read<string[]>('saved', []).includes(slug));
    sync(); window.addEventListener('saved-change', sync); return () => window.removeEventListener('saved-change', sync);
  }, [slug]);
  return (
    <button type="button" className="fav" aria-pressed={on} aria-label={on ? `Remove ${name} from saved` : `Save ${name}`}
      onClick={() => {
        const s = read<string[]>('saved', []);
        write('saved', on ? s.filter((x) => x !== slug) : [...s, slug]);
        window.dispatchEvent(new Event('saved-change'));
      }}>
      <svg viewBox="0 0 24 24" aria-hidden><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
    </button>
  );
}

export function SavedGrid({ cards }: { cards: Record<string, ReactNode> }) {
  const [saved, setSaved] = useState<string[] | null>(null);
  useEffect(() => {
    const sync = () => setSaved(read<string[]>('saved', []));
    sync(); window.addEventListener('saved-change', sync); return () => window.removeEventListener('saved-change', sync);
  }, []);
  if (saved === null) return null;
  const list = saved.filter((s) => cards[s]);
  if (!list.length) return (
    <div className="empty" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
      <div><h2>Nothing saved yet.</h2><p>Tap the heart on any studio to keep it here.</p><Link className="btn" href="/explore">Explore</Link></div>
    </div>
  );
  return <div className="grid-cards">{list.map((s) => <div key={s}>{cards[s]}</div>)}</div>;
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(read('cookies', null) === null); }, []);
  if (!show) return null;
  const choose = (v: string) => { write('cookies', v); setShow(false); };
  return (
    <div className="cookie" role="region" aria-label="Cookies">
      <strong>Cookies.</strong>
      <p>We use essential cookies to run the site. With your OK we&apos;ll also use analytics to see what&apos;s working.</p>
      <div className="actions">
        <button className="btn btn-line" type="button" onClick={() => choose('analytics')}>Accept analytics</button>
        <button className="btn btn-line" type="button" onClick={() => choose('essential')}>Essential only</button>
      </div>
    </div>
  );
}

// ---------- home ----------
type Item = { id: string; plural: string; count: number; photo: string; alt: string };
export function Switcher({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0].id);
  return (
    <div className="hero-switch">
      <div className="stage">
        {items.map((it, i) => (
          <Image key={it.id} src={it.photo} alt={it.id === active ? it.alt : ''} fill priority={i === 0} sizes="(max-width: 1440px) 100vw, 1344px" data-on={it.id === active} />
        ))}
      </div>
      <nav className="switcher" aria-label="Browse by space">
        {items.map((it) => (
          <a key={it.id} href={`/explore?category=${it.id}`} aria-current={it.id === active} onMouseEnter={() => setActive(it.id)} onFocus={() => setActive(it.id)}>
            {it.plural}<sup>{it.count}</sup>
          </a>
        ))}
      </nav>
    </div>
  );
}

const activities = ['a lookbook', 'a two-camera podcast', 'a music video', 'a product shoot', 'a table read', 'a portrait session'];
export function SearchBar({ cities, today }: { cities: string[]; today: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % activities.length), 2400);
    return () => clearInterval(t);
  }, [paused]);
  return (
    <form className="search" action="/explore" role="search">
      <label><span>What are you making?</span>
        <input name="q" placeholder={activities[i]} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} autoComplete="off" />
      </label>
      <label><span>Where?</span>
        <select name="city" defaultValue="">
          <option value="">Anywhere</option>{cities.map((c) => <option key={c}>{c}</option>)}</select>
      </label>
      <label><span>When?</span>
        <input type="date" name="date" min={today} />
      </label>
      <button className="btn" type="submit">Find a space</button>
    </form>
  );
}

// ---------- booking ----------
export type Lite = { slug: string; name: string; hourly: number; minHours: number; discount8h: number; cleaningFee: number; mode: 'instant' | 'request'; open: number; close: number; tier: string; capacity: number; host: string; photo: string; city: string; province: Province };

function useSlots(slug: string, date: string, hours: number) {
  const [slots, setSlots] = useState<number[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true; setSlots(null); setError(false);
    fetch(`/api/studios/${slug}/availability?date=${date}&hours=${hours}`).then((r) => r.json())
      .then((d) => live && setSlots(d.slots ?? [])).catch(() => live && setError(true));
    return () => { live = false; };
  }, [slug, date, hours]);
  return { slots, error };
}

export function Lines({ s, hours }: { s: Lite; hours: number }) {
  const p = price(s, hours);
  return (
    <div className="lines">
      <div><span>{hours} hrs × ${s.hourly}</span><span className="mono">{cad(p.subtotal)}</span></div>
      {p.discount > 0 && <div><span>Full-day discount ({s.discount8h}%)</span><span className="mono">−{cad(p.discount)}</span></div>}
      {p.cleaning > 0 && <div><span>Cleaning</span><span className="mono">{cad(p.cleaning)}</span></div>}
      <div><span>Service fee</span><span className="mono">{cad(p.serviceFee)}</span></div>
      <div><span>{TAX[s.province].label}</span><span className="mono">{cad(p.tax)}</span></div>
      <div className="total"><span>Total, CAD</span><span className="mono">{cad(p.total)}</span></div>
    </div>
  );
}

export function BookingCard({ s, initialDate, today }: { s: Lite; initialDate: string; today: string }) {
  const [date, setDate] = useState(initialDate);
  const [hours, setHours] = useState(s.minHours);
  const [start, setStart] = useState<number | null>(null);
  const { slots, error } = useSlots(s.slug, date, hours);
  useEffect(() => { setDate(initialDate); }, [initialDate]);
  useEffect(() => { if (slots && start !== null && !slots.includes(start)) setStart(null); }, [slots, start]);
  const total = price(s, hours).total;
  const href = start !== null ? `/book/${s.slug}?date=${date}&start=${start}&hours=${hours}` : undefined;
  const cta = s.mode === 'instant' ? 'Book instantly' : 'Request to book';
  return (
    <>
      <aside className="book-card" id="book" aria-label="Book this studio">
        <div className="book-price"><strong>${s.hourly}</strong><span>/hr</span><span className="muted small">{s.minHours} hr minimum</span></div>
        {s.mode === 'instant' && <span className="tag tag-instant" style={{ justifySelf: 'start' }}>Instant book</span>}
        <label className="field"><span>Date</span>
          <input className="input" type="date" value={date} min={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <div className="field"><span id="hrs">Hours</span>
          <div className="stepper" role="group" aria-labelledby="hrs">
            <button type="button" aria-label="Fewer hours" disabled={hours <= s.minHours} onClick={() => setHours(hours - 1)}>−</button>
            <output aria-live="polite">{hours} hrs</output>
            <button type="button" aria-label="More hours" disabled={hours >= Math.min(10, s.close - s.open)} onClick={() => setHours(hours + 1)}>+</button>
          </div>
        </div>
        <div className="field"><span>Start time <span className="muted">(times in {s.city})</span></span>
          {error && <p className="error" role="alert">Couldn&apos;t load times. Pick the date again to retry.</p>}
          {!error && slots === null && <p className="muted small" aria-busy="true">Checking the calendar…</p>}
          {slots?.length === 0 && <p className="muted small">No {hours}-hour gaps left that day. Try another date or fewer hours.</p>}
          {!!slots?.length && (
            <div className="slots">
              {slots.map((h) => <button key={h} type="button" className="slot" aria-pressed={start === h} onClick={() => setStart(h)}>{hh(h)}</button>)}
            </div>
          )}
        </div>
        <Lines s={s} hours={hours} />
        {href
          ? <Link className="btn btn-commit btn-block" href={href}>{cta}, {cad(total)}</Link>
          : <button className="btn btn-commit btn-block" type="button" aria-disabled="true" onClick={() => document.querySelector<HTMLButtonElement>('.slot')?.focus()}>Pick a start time</button>}
        <p className="muted small" style={{ textAlign: 'center' }}>
          {s.mode === 'request' ? "You won't be charged until the host confirms." : "You won't be charged yet."}
        </p>
      </aside>
      <div className="book-bar">
        <div><strong className="mono">${s.hourly}/hr</strong><div className="muted small">{cad(total)} for {hours} hrs</div></div>
        <a className="btn btn-commit" href="#book">{start === null ? 'Choose a time' : cta}</a>
      </div>
    </>
  );
}

const longDate = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

type Hold = { id: string; token: string; expires: number; clientSecret: string | null };

export function Checkout({ s, date, start, hours, user, stripeKey }: { s: Lite; date: string; start: number; hours: number; user: { name: string; email: string } | null; stripeKey: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'pay'>('details');
  const [hold, setHold] = useState<Hold | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [taken, setTaken] = useState<{ date: string; start: number }[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ guests: '4', project: '', note: '', who: '', email: '', card: '', exp: '', cvc: '', name: '', agree: false });
  const errRef = useRef<HTMLDivElement>(null);
  const total = price(s, hours).total;

  useEffect(() => {
    if (!hold) return;
    const t = setInterval(() => {
      const ms = hold.expires - Date.now();
      setLeft(Math.max(0, ms));
      if (ms <= 0) { setHold(null); setStep('details'); setErrors({ form: 'Your 10-minute hold ran out and the time was released. Continue again to hold it.' }); }
    }, 500);
    return () => clearInterval(t);
  }, [hold]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  async function toPayment(e: React.FormEvent) {
    e.preventDefault();
    const g = Number(form.guests);
    const errs: Record<string, string> = {};
    if (!Number.isInteger(g) || g < 1 || g > s.capacity) errs.guests = `This studio takes up to ${s.capacity} people.`;
    if (!form.project.trim()) errs.project = 'Tell the host what you are making.';
    if (!user && !form.who.trim()) errs.who = 'Your name, for the host.';
    if (!user && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Your confirmation goes here.';
    setErrors(errs);
    if (Object.keys(errs).length) { errRef.current?.focus(); return; }
    setBusy(true);
    const r = await fetch('/api/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug: s.slug, date, start, hours, guests: g, project: form.project, note: form.note, ...(user ? {} : { name: form.who, email: form.email }) }) }).catch(() => null);
    setBusy(false);
    if (!r) return setErrors({ form: 'We couldn’t reach the server. Check your connection and try again.' });
    const d = await r.json();
    if (r.status === 409) return setTaken(d.alternatives);
    if (!r.ok) return setErrors({ form: 'That time can’t be booked. Go back and pick another.' });
    setHold(d); setStep('pay');
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.card.replace(/\s/g, '') !== '4242424242424242') errs.card = 'Test mode: use the Stripe test card 4242 4242 4242 4242.';
    if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(form.exp)) errs.exp = 'Use MM / YY.';
    if (!/^\d{3,4}$/.test(form.cvc)) errs.cvc = 'Three or four digits.';
    if (!form.name.trim()) errs.name = 'The name on the card.';
    if (!form.agree) errs.agree = 'Agree to the house rules to continue.';
    setErrors(errs);
    if (Object.keys(errs).length) { errRef.current?.focus(); return; }
    setBusy(true);
    const r = await fetch(`/api/bookings/${hold!.id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'pay', token: hold!.token }) }).catch(() => null);
    if (r?.ok) return router.push(`/book/confirmed/${hold!.id}?t=${hold!.token}`);
    setBusy(false);
    setErrors({ form: r?.status === 410 ? 'Your hold ran out before payment finished. Continue again to hold the time.' : 'Payment didn’t go through. Nothing was charged; try again.' });
  }

  const mmss = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`;
  const errList = Object.entries(errors);

  return (
    <div className="container">
      <div className="steps" aria-label="Progress">
        <span aria-current={step === 'details' ? 'step' : undefined}>1 Your booking</span>
        <span aria-current={step === 'pay' ? 'step' : undefined}>2 Pay and confirm</span>
        <span>3 Done</span>
      </div>
      <div className="checkout">
        <div style={{ display: 'grid', gap: 16 }}>
          {hold && <p className="notice" role="status">We&apos;re holding {hh(start)} to {hh(start + hours)} for <strong className="mono">{mmss}</strong>. Nobody else can book it meanwhile.</p>}
          {errList.length > 0 && (
            <div className="notice notice-danger" tabIndex={-1} ref={errRef} role="alert">
              <ul style={{ margin: 0, paddingLeft: 18 }}>{errList.map(([k, v]) => <li key={k}>{v}</li>)}</ul>
            </div>
          )}
          {taken && (
            <div className="panel" role="alert">
              <h2>Someone just booked that time.</h2>
              <p>Here are the nearest free slots.</p>
              <div className="actions">
                {taken.map((a) => <a key={a.date + a.start} className="btn btn-line" href={`/book/${s.slug}?date=${a.date}&start=${a.start}&hours=${hours}`}>{new Date(a.date + 'T12:00:00Z').toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}, {hh(a.start)}</a>)}
              </div>
            </div>
          )}
          {step === 'details' ? (
            <form className="panel" onSubmit={toPayment} noValidate>
              <h1>Your booking</h1>
              <dl className="facts">
                <dt>Date</dt><dd>{longDate(date)} <Link className="link" href={`/studios/${s.slug}?date=${date}#book`}>Change</Link></dd>
                <dt>Time</dt><dd>{hh(start)} to {hh(start + hours)} ({hours} hrs, {s.city} time)</dd>
              </dl>
              <div className="two">
                <label className="field"><span>People on set</span>
                  <input className="input" type="number" min={1} max={s.capacity} value={form.guests} onChange={set('guests')} aria-invalid={!!errors.guests} aria-describedby="e-guests" />
                  <span id="e-guests" className={errors.guests ? 'error' : 'muted small'}>{errors.guests ?? `Up to ${s.capacity}`}</span>
                </label>
                <label className="field"><span>What are you making?</span>
                  <input className="input" value={form.project} onChange={set('project')} placeholder="Autumn lookbook" aria-invalid={!!errors.project} aria-describedby="e-project" />
                  {errors.project && <span id="e-project" className="error">{errors.project}</span>}
                </label>
              </div>
              {!user && (
                <div className="two">
                  <label className="field"><span>Your name</span>
                    <input className="input" autoComplete="name" value={form.who} onChange={set('who')} aria-invalid={!!errors.who} aria-describedby="e-who" />
                    {errors.who && <span id="e-who" className="error">{errors.who}</span>}
                  </label>
                  <label className="field"><span>Email</span>
                    <input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby="e-email" />
                    {errors.email && <span id="e-email" className="error">{errors.email}</span>}
                  </label>
                </div>
              )}
              {!user && <p className="muted small">Have an account? <Link className="link" href={`/sign-in?next=${encodeURIComponent(`/book/${s.slug}?date=${date}&start=${start}&hours=${hours}`)}`}>Sign in</Link> to keep this booking with it.</p>}
              <label className="field"><span>Note to {s.host}</span>
                <textarea className="input" value={form.note} onChange={set('note')} placeholder="Arrival time, kit you're bringing, anything the host should set up." />
              </label>
              <button className="btn btn-block" type="submit" aria-busy={busy} disabled={busy}>{busy ? 'Holding your time…' : 'Continue to payment'}</button>
            </form>
          ) : hold?.clientSecret && stripeKey ? (
            <StripePay s={s} hold={hold} stripeKey={stripeKey} total={total} />
          ) : (
            <form className="panel" onSubmit={pay} noValidate>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <h2>Pay and confirm</h2><span className="tag">Test card stand-in</span>
              </div>
              <p className="muted small">No Stripe keys are set, so this form stands in for Stripe. {s.mode === 'instant' ? 'Charged now.' : `Authorised now, charged only when ${s.host} accepts.`} Use card 4242 4242 4242 4242, any future date, any CVC.</p>
              <label className="field"><span>Card number</span>
                <input className="input mono" inputMode="numeric" autoComplete="off" value={form.card} onChange={set('card')} placeholder="4242 4242 4242 4242" aria-invalid={!!errors.card} aria-describedby="e-card" />
                {errors.card && <span id="e-card" className="error">{errors.card}</span>}
              </label>
              <div className="two">
                <label className="field"><span>Expiry</span>
                  <input className="input mono" value={form.exp} onChange={set('exp')} placeholder="MM / YY" aria-invalid={!!errors.exp} aria-describedby="e-exp" />
                  {errors.exp && <span id="e-exp" className="error">{errors.exp}</span>}
                </label>
                <label className="field"><span>Security code</span>
                  <input className="input mono" inputMode="numeric" value={form.cvc} onChange={set('cvc')} placeholder="123" aria-invalid={!!errors.cvc} aria-describedby="e-cvc" />
                  {errors.cvc && <span id="e-cvc" className="error">{errors.cvc}</span>}
                </label>
              </div>
              <label className="field"><span>Name on card</span>
                <input className="input" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby="e-name" />
                {errors.name && <span id="e-name" className="error">{errors.name}</span>}
              </label>
              <label style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
                <input type="checkbox" checked={form.agree} onChange={set('agree')} style={{ width: 20, height: 20, accentColor: 'var(--color-ink)' }} />
                <span>I agree to the house rules and the {s.tier} cancellation policy.</span>
              </label>
              <button className="btn btn-commit btn-block" type="submit" aria-busy={busy} disabled={busy}>{busy ? 'Confirming…' : `Pay ${cad(total)}`}</button>
            </form>
          )}
        </div>
        <SummaryPanel s={s} date={date} start={start} hours={hours} />
      </div>
    </div>
  );
}

function SummaryPanel({ s, date, start, hours }: { s: Lite; date: string; start: number; hours: number }) {
  return (
    <aside className="panel summary" aria-label="Summary">
      <Image src={s.photo} alt="" width={600} height={375} />
      <h2>{s.name}</h2>
      <p className="small">{longDate(date)}, {hh(start)} to {hh(start + hours)}</p>
      <p className="small muted">Cancellation: {s.tier}</p>
      <Lines s={s} hours={hours} />
    </aside>
  );
}

export function BookingAction({ id, action, label, line }: { id: string; action: 'accept' | 'decline' | 'cancel'; label: string; line?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  return (
    <>
      <button type="button" className={line ? 'btn btn-line' : 'btn btn-commit'} aria-busy={busy} disabled={busy}
        onClick={async () => {
          if (action === 'cancel' && !confirm('Cancel this booking? The refund shown is what you get back.')) return;
          setBusy(true); setErr(false);
          const r = await fetch(`/api/bookings/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) }).catch(() => null);
          setBusy(false); if (r?.ok) router.refresh(); else setErr(true);
        }}>{busy ? 'Saving…' : label}</button>
      {err && <span className="error" role="alert">That didn&apos;t save. Try again.</span>}
    </>
  );
}

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  if (sent) return <div className="panel" role="status"><h2>Thanks. We reply within a working day.</h2></div>;
  return (
    <form className="panel" noValidate onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const errs: Record<string, string> = {};
      if (!String(f.get('name')).trim()) errs.name = 'Your name, please.';
      if (!/^\S+@\S+\.\S+$/.test(String(f.get('email')))) errs.email = 'That email doesn’t look right.';
      if (String(f.get('message')).trim().length < 10) errs.message = 'A sentence or two, so we know how to help.';
      if (f.get('website')) return; // honeypot
      setErrors(errs);
      // no mail provider yet; success is local. Wire to a server action + Resend when the backend lands.
      if (!Object.keys(errs).length) setSent(true);
    }}>
      <label className="field"><span>Name</span><input className="input" name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby="c-name" />{errors.name && <span id="c-name" className="error">{errors.name}</span>}</label>
      <label className="field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby="c-email" />{errors.email && <span id="c-email" className="error">{errors.email}</span>}</label>
      <label className="field"><span>I&apos;m a…</span><select className="input" name="role"><option>Guest</option><option>Host</option><option>Press</option></select></label>
      <label className="field"><span>Message</span><textarea className="input" name="message" aria-invalid={!!errors.message} aria-describedby="c-msg" />{errors.message && <span id="c-msg" className="error">{errors.message}</span>}</label>
      <input name="website" tabIndex={-1} autoComplete="off" className="sr" aria-hidden />
      <button className="btn" type="submit">Send message</button>
    </form>
  );
}

// ---------- Stripe Payment Element (test mode) ----------
const stripeFor: Record<string, Promise<StripeJs | null>> = {};
const getStripe = (k: string) => (stripeFor[k] ??= loadStripe(k));
const token = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function StripePay({ s, hold, stripeKey, total }: { s: Lite; hold: Hold; stripeKey: string; total: number }) {
  const [appearance, setAppearance] = useState<object | null>(null);
  // Stripe's iframe can't read our CSS variables, so hand it their computed values.
  useEffect(() => setAppearance({ theme: 'flat', variables: { colorPrimary: token('--color-ink'), colorBackground: token('--color-surface'), colorText: token('--color-ink'), colorDanger: token('--color-danger'), borderRadius: '0px', fontFamily: 'system-ui, sans-serif' } }), []);
  if (!appearance) return <div className="panel" aria-busy="true"><p className="muted">Loading secure payment…</p></div>;
  return (
    <Elements stripe={getStripe(stripeKey)} options={{ clientSecret: hold.clientSecret!, appearance }}>
      <StripeForm s={s} hold={hold} total={total} />
    </Elements>
  );
}

function StripeForm({ s, hold, total }: { s: Lite; hold: Hold; total: number }) {
  const stripe = useStripe(), elements = useElements(), router = useRouter();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const done = `/book/confirmed/${hold.id}?t=${hold.token}`;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return setErr('Agree to the house rules to continue.');
    if (!stripe || !elements) return;
    setBusy(true); setErr('');
    const { error } = await stripe.confirmPayment({ elements, redirect: 'if_required', confirmParams: { return_url: location.origin + done } });
    if (error) { setBusy(false); return setErr(error.message ?? 'Payment didn’t go through. Nothing was charged; try again.'); }
    await fetch(`/api/bookings/${hold.id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'pay', token: hold.token }) }).catch(() => null);
    router.push(done);
  }
  return (
    <form className="panel" onSubmit={submit} noValidate>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <h2>Pay and confirm</h2><span className="tag">Stripe test mode</span>
      </div>
      <p className="muted small">{s.mode === 'instant' ? 'Charged now.' : `Authorised now, charged only when ${s.host} accepts.`} Test card 4242 4242 4242 4242, any future date, any CVC.</p>
      <PaymentElement />
      {err && <p className="error" role="alert">{err}</p>}
      <label style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--color-ink)' }} />
        <span>I agree to the house rules and the {s.tier} cancellation policy.</span>
      </label>
      <button className="btn btn-commit btn-block" type="submit" aria-busy={busy} disabled={busy || !stripe}>{busy ? 'Confirming…' : `Pay ${cad(total)}`}</button>
    </form>
  );
}

// ---------- auth ----------
export function SignInForm({ next, mode }: { next: string; mode: 'signin' | 'signup' }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  const up = mode === 'signup';
  const q = next ? `&next=${encodeURIComponent(next)}` : '';
  return (
    <form action={action} style={{ display: 'grid', gap: 16 }} noValidate>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="next" value={next} />
      {state.error && <p className="notice notice-danger" role="alert">{state.error}</p>}
      {up && <label className="field"><span>Name</span><input className="input" name="name" autoComplete="name" defaultValue={state.name} required /></label>}
      <label className="field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" defaultValue={state.email} required /></label>
      <label className="field"><span>Password</span><input className="input" name="password" type="password" autoComplete={up ? 'new-password' : 'current-password'} minLength={up ? 10 : undefined} required />{up && <span className="muted small">At least 10 characters.</span>}</label>
      <button className="btn btn-commit btn-block" type="submit" aria-busy={pending} disabled={pending}>{pending ? 'One moment…' : up ? 'Make account' : 'Sign in'}</button>
      <p className="small">{up ? <>Have an account? <Link className="link" href={`/sign-in?${q.slice(1)}`}>Sign in</Link></> : <>New here? <Link className="link" href={`/sign-in?mode=signup${q}`}>Make an account</Link></>}</p>
    </form>
  );
}

export function SignOut() {
  return <form action={signOut}><button className="btn btn-line" type="submit">Sign out</button></form>;
}
