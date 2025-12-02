import Link from 'next/link';
import Image from 'next/image';
import { getCatalog } from '@/lib/db';

export const metadata = { title: 'Journal' };

export default async function Journal({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const { posts } = await getCatalog();
  const cats = [...new Set(posts.map((p) => p.category))];
  const list = posts.filter((p) => !category || p.category === category);
  const [lead, ...rest] = list;
  return (
    <div className="container">
      <header className="page-head"><h1>Journal</h1><p>Notes on light, sound and running a studio.</p></header>
      <div className="tabs">
        <Link className="chip" href="/journal" aria-current={!category}>All</Link>
        {cats.map((c) => <Link key={c} className="chip" href={`/journal?category=${c}`} aria-current={category === c}>{c}</Link>)}
      </div>
      {lead && (
        <Link href={`/journal/${lead.slug}`} className="lead-post">
          <Image src={lead.photo} alt="" width={1200} height={800} priority sizes="66vw" />
          <div>
            <span className="muted small">{lead.category}, {lead.date}</span>
            <h2>{lead.title}</h2>
            <p>{lead.standfirst}</p>
          </div>
        </Link>
      )}
      {rest.length > 0 && (
        <div className="post-rows">
          {rest.map((p) => (
            <Link key={p.slug} href={`/journal/${p.slug}`} className="post-row">
              <span className="mono small muted">{p.date}</span>
              <div><h3>{p.title}</h3><p className="muted small" style={{ marginTop: 6 }}>{p.standfirst}</p></div>
              <span className="small">{p.category}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
