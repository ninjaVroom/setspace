// Pure booking maths. No imports, so `node --test` can run it directly.
// Times are whole hours in the studio's own time zone; every studio carries its IANA zone.

export type Province = 'ON' | 'QC' | 'BC' | 'AB';
/** Sales tax on short-term space rental plus our fee: HST in Ontario, GST + QST in Québec, GST alone in BC and Alberta. */
export const TAX: Record<Province, { rate: number; label: string }> = {
  ON: { rate: 13, label: 'HST 13%' },
  QC: { rate: 14.975, label: 'GST 5% + QST 9.975%' },
  BC: { rate: 5, label: 'GST 5%' },
  AB: { rate: 5, label: 'GST 5%' },
};

export type Pricing = { hourly: number; minHours: number; discount8h: number; cleaningFee: number; province: Province };
export type Range = { start: number; hours: number };

/** All amounts in integer cents (CAD). Tax applies to the whole pre-tax bill, our fee included. */
export function price(p: Pricing, hours: number) {
  const subtotal = p.hourly * 100 * hours;
  const discount = hours >= 8 ? Math.round((subtotal * p.discount8h) / 100) : 0;
  const cleaning = p.cleaningFee * 100;
  const serviceFee = Math.round((subtotal - discount + cleaning) * 0.1);
  const beforeTax = subtotal - discount + cleaning + serviceFee;
  const tax = Math.round((beforeTax * TAX[p.province].rate) / 100);
  return { subtotal, discount, cleaning, serviceFee, tax, total: beforeTax + tax };
}

/** Half-open ranges: a 10–12 booking and a 12–14 booking do not collide. Same rule as tstzrange '[)'. */
export const overlaps = (a: Range, b: Range) => a.start < b.start + b.hours && b.start < a.start + a.hours;

/** Start hours that fit `hours` inside opening hours without touching anything busy. Taken slots are removed, not greyed. */
export function computeSlots(open: number, close: number, hours: number, busy: Range[]) {
  const out: number[] = [];
  for (let s = open; s + hours <= close; s++) {
    if (!busy.some((b) => overlaps({ start: s, hours }, b))) out.push(s);
  }
  return out;
}

const DAY = 864e5;
/** Refund in cents for a cancellation `hoursBefore` the start, booked `hoursSinceBooking` ago. */
export function refundFor(tier: 'flexible' | 'moderate' | 'strict', total: number, hoursBefore: number, hoursSinceBooking: number) {
  if (hoursSinceBooking <= 24 && hoursBefore > 48) return total; // grace period
  const days = (hoursBefore * 3600e3) / DAY;
  if (tier === 'flexible') return hoursBefore >= 24 ? total : 0;
  if (tier === 'moderate') return days >= 7 ? total : hoursBefore >= 24 ? Math.round(total / 2) : 0;
  return days >= 7 ? Math.round(total / 2) : 0;
}

export const cad = (cents: number) => '$' + (cents / 100).toLocaleString('en-CA', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
/** 9 → "9 am", 13 → "1 pm". */
export const hh = (h: number) => `${h % 12 || 12} ${h % 24 < 12 ? 'am' : 'pm'}`;

// Calendar helpers. Dates are YYYY-MM-DD in the studio's zone; hours are whole local hours.
/** Where "today" means the site as a whole (dashboards, defaults). */
export const SITE_TZ = 'America/Toronto';
/** The westernmost zone we list in: the earliest "today" anywhere, so date pickers never hide a valid day. */
export const WEST_TZ = 'America/Vancouver';

/** Calendar date in `tz`, `offset` days from `now`. */
export const localDate = (tz: string, offset = 0, now = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(now + offset * DAY));
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
};
export const weekday = (iso: string) => (new Date(iso + 'T12:00:00Z').getUTCDay() + 6) % 7; // Mon = 0

/** UTC offset of `tz` at instant `t`, in ms ("GMT-4" → -4h, "GMT-3:30" → -3.5h). */
function offset(tz: string, t: number) {
  const v = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date(t)).find((p) => p.type === 'timeZoneName')!.value;
  const m = v.match(/GMT([+-])(\d+)(?::(\d+))?/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) * 60e3 : 0;
}
/** Local date + hour in `tz` as a UTC instant. Two passes so a DST change between the guess and the answer is caught. */
export function zonedInstant(date: string, hour: number, tz: string) {
  const wall = new Date(`${date}T00:00:00Z`).getTime() + hour * 3600e3;
  const first = wall - offset(tz, wall);
  return new Date(wall - offset(tz, first));
}
/** UTC instant back to local date + hour in `tz`. */
export function zonedParts(t: Date | string, tz: string) {
  const d = new Date(t);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(d));
  return { date, hour };
}
