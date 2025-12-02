import type { Province } from './booking';

// Taxonomy and shared types. Studios, bookings, reviews, posts and FAQs live in Postgres (payload.config.ts).

export type Category = 'daylight' | 'podcast' | 'film' | 'workspace';
export type Studio = {
  id: number; hostId: number;
  slug: string; name: string; category: Category; city: string; area: string; postcode: string; province: Province; tz: string;
  photo: string; gallery: string[]; alt: string;
  hourly: number; minHours: number; discount8h: number; cleaningFee: number;
  m2: number; ceiling: number; capacity: number; light: string;
  mode: 'instant' | 'request'; tier: 'flexible' | 'moderate' | 'strict';
  open: number; close: number; host: string; featured: boolean;
  lat: number; lng: number; // neighbourhood centre, not the door: the address arrives with the booking
  blurb: string; space: string[]; pull: string; lit: string;
  included: string[]; rules: [string, string][]; transit: string;
};

export const categories: { id: Category; name: string; plural: string }[] = [
  { id: 'daylight', name: 'Daylight studio', plural: 'Daylight studios' },
  { id: 'podcast', name: 'Podcast room', plural: 'Podcast rooms' },
  { id: 'film', name: 'Film set', plural: 'Film sets' },
  { id: 'workspace', name: 'Workspace', plural: 'Workspaces' },
];

const P = (n: string) => `/photos/${n}.png`;
const hero = P('01-hero-daylight-cyc'), pod = P('02-podcast-acoustic-room'), film = P('03-film-warehouse-stage'),
  atelier = P('04-atelier-workspace-loft'), arch = P('05-studio-gpn-stone-arch'), roof = P('06-rooftop-blue-hour'),
  grip = P('07-lighting-grip-detail'), window = P('08-journal-window-light'), plaster = P('09-empty-plaster-room');
export const photos = { hero, pod, film, atelier, arch, roof, grip, window, plaster };

export const cities = [
  { name: 'Toronto', province: 'ON', areas: 'Fashion District, Leslieville, Port Lands, Little Portugal, Junction Triangle', lat: 43.6532, lng: -79.3832 },
  { name: 'Montréal', province: 'QC', areas: 'Mile End, Saint-Henri', lat: 45.5019, lng: -73.5674 },
  { name: 'Vancouver', province: 'BC', areas: 'Yaletown', lat: 49.2827, lng: -123.1207 },
  { name: 'Calgary', province: 'AB', areas: 'Inglewood', lat: 51.0447, lng: -114.0719 },
];

export type Review = { studio: string; author: string; role: string; rating: number; date: string; body: string };
export type Post = { slug: string; title: string; standfirst: string; category: string; date: string; read: number; photo: string; author: string; body: string[]; studios: string[] };
