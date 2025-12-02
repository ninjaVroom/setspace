'use client';
import Link from 'next/link';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container" style={{ paddingBlock: 96, maxWidth: 720 }}>
      <h1 style={{ fontSize: 'var(--text-display-l)' }}>Something broke on our side.</h1>
      <p className="muted" style={{ marginTop: 16 }}>Nothing was charged. Try again, or start from the studios.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
        <button className="btn" type="button" onClick={reset}>Try again</button>
        <Link className="btn btn-line" href="/explore">Explore studios</Link>
      </div>
    </div>
  );
}
