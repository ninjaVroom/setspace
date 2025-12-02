import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

// Who may show this site in an iframe: itself, plus the portfolio origin(s) in FRAME_ANCESTORS
// (space-separated, e.g. "https://samuelvroom.com"). Unset = no other site can embed it.
const frameAncestors = ["'self'", process.env.FRAME_ANCESTORS ?? ''].join(' ').trim();

const config: NextConfig = {
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors}` }] }];
  },
};
export default withPayload(config);
