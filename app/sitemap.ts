import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/db';
import { cities } from '@/lib/data';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { studios, posts } = await getCatalog();
  return [
    ...['', '/explore', '/journal', '/about', '/help', '/case-study'].map((p) => ({ url: base + p })),
    ...cities.map((c) => ({ url: `${base}/explore?city=${encodeURIComponent(c.name)}` })),
    ...studios.map((s) => ({ url: `${base}/studios/${s.slug}` })),
    ...posts.map((p) => ({ url: `${base}/journal/${p.slug}` })),
  ];
}
