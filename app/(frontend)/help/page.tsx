import Link from 'next/link';
import { getCatalog } from '@/lib/db';

export const metadata = { title: 'Help' };

export default async function Help({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').toLowerCase().trim();
  const { faqs } = await getCatalog();
  const list = faqs.filter((f) => !q || (f.q + ' ' + f.a).toLowerCase().includes(q));
  const groups = [...new Set(list.map((f) => f.group))];
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  return (
    <div className="container" style={{ maxWidth: 880 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="page-head"><h1>Questions, answered.</h1></header>
      <form action="/help" role="search" style={{ display: 'flex', gap: 8, marginTop: 32 }}>
        <label className="sr" htmlFor="hq">Search help</label>
        <input id="hq" className="input" name="q" defaultValue={q} placeholder='Search help, e.g. "cancel"' />
        <button className="btn" type="submit">Search</button>
      </form>
      {groups.length === 0 && <p style={{ marginTop: 48 }}>Nothing matches “{q}”. <Link className="link" href="/help">Show all questions</Link></p>}
      {groups.map((g) => (
        <section key={g} className="faq-group rules">
          <h2>{g}</h2>
          {list.filter((f) => f.group === g).map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>
      ))}
      <p style={{ marginTop: 64 }}>Still stuck? <Link className="link" href="/contact">Talk to a person</Link></p>
    </div>
  );
}
