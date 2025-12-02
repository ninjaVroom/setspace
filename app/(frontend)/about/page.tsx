import Link from 'next/link';
import Image from 'next/image';
import { photos } from '@/lib/data';

export const metadata = { title: 'About' };

const cols = [
  ['The room shapes the work', 'A north window, a quiet floor or a drive-in door changes what you can make. We list rooms by those facts.'],
  ['Specs, not adjectives', 'Every listing shows floor area, ceiling height, capacity and where the light comes from. You should know the room before you arrive.'],
  ['No double-booked mornings', 'When you pay, the time is held for you. The database refuses any second booking that overlaps it.'],
];

export default function About() {
  return (
    <>
      <div className="container manifesto" style={{ paddingTop: 96 }}>
        <h1>Rooms change what gets made.</h1>
        <div className="manifesto-cols">
          {cols.map(([h, t]) => <div key={h}><h2>{h}</h2><p className="muted">{t}</p></div>)}
        </div>
      </div>
      <div className="wide-photo container"><Image src={photos.arch} alt="Limestone arches in raking afternoon sun" width={1672} height={941} sizes="(max-width: 1440px) 100vw, 1344px" /></div>
      <div className="container section">
        <div className="manifesto-cols" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', marginTop: 0 }}>
          <div><h2>For guests</h2><p className="muted">Search by what you&apos;re making, check the specs, pick a time. Instant rooms confirm on the spot; the rest answer within 24 hrs.</p><Link className="link" href="/explore">Find a space</Link></div>
          <div><h2>For hosts</h2><p className="muted">List free. Set the price, the hours, the minimum and the rules. Paid 24 hrs after each booking ends.</p><Link className="link" href="/host">List your space</Link></div>
        </div>
      </div>
    </>
  );
}
