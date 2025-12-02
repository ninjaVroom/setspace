import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono, Bodoni_Moda } from 'next/font/google';
import { Nav, Footer } from '@/components/ui';
import { CookieBanner } from '@/components/client';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--f-geist' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--f-geist-mono' });
const bodoni = Bodoni_Moda({ subsets: ['latin'], variable: '--f-bodoni', axes: ['opsz'] });

export const metadata: Metadata = {
  title: { default: 'SETSPACE · Book photo studios, podcast rooms and film sets', template: '%s · SETSPACE' },
  description: 'Photo studios, podcast rooms and film sets in Toronto, Montréal, Vancouver and Calgary, bookable by the hour.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: { type: 'website', locale: 'en_CA', siteName: 'SETSPACE' },
};

// Applies the saved theme before paint so dark mode never flashes light.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={`${geist.variable} ${mono.variable} ${bodoni.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body suppressHydrationWarning>
        <a className="sr skip" href="#main">Skip to content</a>
        <div className="demo-strip" role="note"><div className="container"><span>Portfolio demo with seeded data and Stripe in test mode.</span><Link href="/sign-in">Sign in as a guest or host</Link><Link href="/case-study">How it&apos;s built</Link></div></div>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
