import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = (await getCatalog()).posts.find((x) => x.slug === slug);
  return p ? { title: p.title, description: p.standfirst } : {};
}
export const dynamic = 'force-dynamic';

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { posts, studioBySlug } = await getCatalog();
  const p = posts.find((x) => x.slug === slug);
  if (!p) notFound();
  const related = posts.filter((x) => x.slug !== p.slug).slice(0, 2);
  return (
    <article>
      <header className="article container">
        <span className="muted small">{p.category}, {p.date}, {p.read} min read, by {p.author}</span>
        <h1 style={{ marginTop: 16 }}>{p.title}</h1>
        <p className="standfirst">{p.standfirst}</p>
      </header>
      <figure className="article-photo container"><Image src={p.photo} alt="" width={1600} height={1067} priority sizes="(max-width: 1440px) 100vw, 1200px" /></figure>
      <div className="article-body container">{p.body.map((t, i) => <p key={i}>{t}</p>)}</div>
      <aside className="embed container" aria-label="Spaces in this story">
        <h2 style={{ fontSize: 'var(--text-h3)' }}>Spaces in this story</h2>
        {p.studios.map((sl) => {
          const s = studioBySlug(sl)!;
          return (
            <div className="embed-row" key={sl}>
              <Image src={s.photo} alt="" width={240} height={300} />
              <div><strong className="serif" style={{ fontSize: '1.5rem' }}>{s.name}</strong><p className="muted small">{s.area}, {s.m2} m², {s.light.toLowerCase()} light, ${s.hourly}/hr</p></div>
              <Link className="btn btn-line" href={`/studios/${s.slug}`}>See times</Link>
            </div>
          );
        })}
      </aside>
      <section className="container section">
        <div className="section-head"><h2>Read next</h2></div>
        <div className="journal-teasers" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
          {related.map((r) => (
            <Link key={r.slug} href={`/journal/${r.slug}`} className="post-card">
              <Image src={r.photo} alt="" width={900} height={600} sizes="50vw" />
              <h3>{r.title}</h3>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
