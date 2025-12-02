import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'SETSPACE: book photo studios, podcast rooms and film sets across Canada';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Share card: the hero photograph, the wordmark and the line. Colours mirror the paper/ink/lime tokens.
export default async function Image() {
  const photo = await readFile(join(process.cwd(), 'public/photos/01-hero-daylight-cyc.png'));
  const src = `data:image/png;base64,${photo.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#191919', color: '#F5F3ED' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={600} height={630} style={{ objectFit: 'cover' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 56, width: 600 }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>SETSPACE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>Make space for great ideas.</div>
            <div style={{ fontSize: 26, color: '#A39D92' }}>Studios by the hour in Toronto, Montréal, Vancouver and Calgary.</div>
          </div>
          <div style={{ display: 'flex', alignSelf: 'flex-start', background: '#B7D36B', color: '#191919', padding: '10px 22px', borderRadius: 999, fontSize: 24 }}>Find a space</div>
        </div>
      </div>
    ),
    size,
  );
}
