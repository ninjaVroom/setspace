import Link from 'next/link';
import Image from 'next/image';
import { photos } from '@/lib/data';

export default function NotFound() {
  return (
    <div className="container empty" style={{ paddingTop: 96 }}>
      <Image src={photos.plaster} alt="An empty plaster room" width={1200} height={750} />
      <div><h1 style={{ fontSize: 'var(--text-display-m)', marginBottom: 16 }}>This room doesn&apos;t exist.</h1><p>The link may be old, or the listing was taken down.</p><Link className="btn" href="/explore">Explore spaces</Link></div>
    </div>
  );
}
