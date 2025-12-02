import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig, type Access, type CollectionConfig, type Where } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import sharp from 'sharp';

const dirname = path.dirname(fileURLToPath(import.meta.url));

type Role = 'guest' | 'host' | 'admin';
const has = (u: unknown, r: Role) => !!(u as { roles?: Role[] } | null)?.roles?.includes(r);
const admin: Access = ({ req }) => has(req.user, 'admin');
const anyone: Access = () => true;
const nobody: Access = () => false;

const Users: CollectionConfig = {
  slug: 'users',
  auth: { tokenExpiration: 60 * 60 * 24 * 7 },
  admin: { useAsTitle: 'name' },
  access: {
    admin: ({ req }) => has(req.user, 'admin') || has(req.user, 'host'),
    create: anyone, // sign-up; roles below can only be set by an admin
    read: ({ req }) => (has(req.user, 'admin') ? true : req.user ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => (has(req.user, 'admin') ? true : req.user ? { id: { equals: req.user.id } } : false),
    delete: admin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles', type: 'select', hasMany: true, defaultValue: ['guest'], saveToJWT: true,
      options: ['guest', 'host', 'admin'],
      access: { create: ({ req }) => has(req.user, 'admin'), update: ({ req }) => has(req.user, 'admin') },
    },
    { name: 'stripeCustomerId', type: 'text', admin: { readOnly: true } },
  ],
};

const ownStudio: Access = ({ req }) => (has(req.user, 'admin') ? true : req.user ? { owner: { equals: req.user.id } } : false);

const Studios: CollectionConfig = {
  slug: 'studios',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'city', 'hourly', 'status'] },
  access: {
    read: ({ req }) => {
      if (has(req.user, 'admin')) return true;
      const live: Where = { status: { equals: 'live' } };
      return req.user ? { or: [live, { owner: { equals: req.user.id } }] } : live;
    },
    create: ({ req }) => has(req.user, 'host') || has(req.user, 'admin'),
    update: ownStudio,
    delete: ownStudio,
  },
  hooks: { beforeChange: [({ req, data, operation }) => (operation === 'create' && req.user && !has(req.user, 'admin') ? { ...data, owner: req.user.id } : data)] },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true },
    { name: 'status', type: 'select', defaultValue: 'draft', options: ['draft', 'review', 'live', 'paused'], index: true },
    { name: 'featured', type: 'checkbox' },
    { name: 'category', type: 'select', required: true, options: ['daylight', 'podcast', 'film', 'workspace'] },
    { type: 'row', fields: [{ name: 'city', type: 'text', required: true }, { name: 'area', type: 'text', required: true }, { name: 'postcode', type: 'text', required: true, label: 'Postal code (first 3)' }] },
    { type: 'row', fields: [
      { name: 'province', type: 'select', required: true, defaultValue: 'ON', options: ['ON', 'QC', 'BC', 'AB'] },
      { name: 'timezone', type: 'select', required: true, defaultValue: 'America/Toronto', options: ['America/Toronto', 'America/Edmonton', 'America/Vancouver'] },
    ] },
    { type: 'row', fields: [{ name: 'lat', type: 'number', required: true, min: 41, max: 84, admin: { description: 'Neighbourhood centre, not the door' } }, { name: 'lng', type: 'number', required: true, min: -142, max: -52 }] },
    // photo paths into /public; swap for a media upload collection + R2 when hosts upload their own.
    { name: 'photo', type: 'text', required: true },
    { name: 'gallery', type: 'array', fields: [{ name: 'src', type: 'text', required: true }] },
    { name: 'alt', type: 'text', required: true },
    { type: 'row', fields: [
      { name: 'hourly', type: 'number', required: true, min: 1, admin: { description: 'CAD per hour, before tax' } },
      { name: 'minHours', type: 'number', required: true, min: 1 },
      { name: 'discount8h', type: 'number', defaultValue: 0, min: 0, max: 50, admin: { description: '% off at 8+ hrs' } },
      { name: 'cleaningFee', type: 'number', defaultValue: 0, min: 0, admin: { description: 'CAD' } },
    ] },
    { type: 'row', fields: [
      { name: 'm2', type: 'number', required: true }, { name: 'ceiling', type: 'number', required: true },
      { name: 'capacity', type: 'number', required: true, min: 1 }, { name: 'light', type: 'text', required: true },
    ] },
    { type: 'row', fields: [
      { name: 'mode', type: 'select', required: true, options: ['instant', 'request'] },
      { name: 'tier', type: 'select', required: true, options: ['flexible', 'moderate', 'strict'] },
      { name: 'open', type: 'number', required: true, min: 0, max: 23 }, { name: 'close', type: 'number', required: true, min: 1, max: 24 },
    ] },
    { name: 'blurb', type: 'text', required: true },
    { name: 'space', type: 'textarea', required: true, admin: { description: 'Paragraphs separated by a blank line' } },
    { name: 'pull', type: 'text' },
    { name: 'lit', type: 'textarea' },
    { name: 'included', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
    { name: 'rules', type: 'array', fields: [{ name: 'title', type: 'text', required: true }, { name: 'text', type: 'text', required: true }] },
    { name: 'transit', type: 'text' },
  ],
};

const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: { useAsTitle: 'guestName', defaultColumns: ['studio', 'start', 'status', 'guestName'] },
  // Writes only through /api/bookings (local API with overrideAccess). Reads are row-scoped.
  access: {
    create: nobody, update: admin, delete: admin,
    read: ({ req }) => (has(req.user, 'admin') ? true : req.user ? { or: [{ guest: { equals: req.user.id } }, { 'studio.owner': { equals: req.user.id } }] as Where[] } : false),
  },
  fields: [
    { name: 'studio', type: 'relationship', relationTo: 'studios', required: true, index: true },
    { name: 'guest', type: 'relationship', relationTo: 'users' },
    { name: 'guestName', type: 'text', required: true },
    { name: 'guestEmail', type: 'email' },
    // start/end are UTC instants; the exclusion constraint in migrations/ compares tstzrange(start, "end", '[)').
    { name: 'start', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'end', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'hours', type: 'number', required: true },
    { name: 'guests', type: 'number', defaultValue: 1 },
    { name: 'project', type: 'text' },
    { name: 'note', type: 'textarea' },
    { name: 'status', type: 'select', required: true, index: true, options: ['hold', 'requested', 'confirmed', 'cancelled', 'completed', 'expired'] },
    { name: 'total', type: 'number', required: true, admin: { description: 'cents, CAD' } },
    { name: 'serviceFee', type: 'number', required: true, admin: { description: 'cents, CAD' } },
    { name: 'holdExpiresAt', type: 'date' },
    { name: 'stripePaymentIntentId', type: 'text', index: true },
    // Unguessable link secret for guest checkout: the confirmation page and guest actions need it (ids are sequential).
    { name: 'accessToken', type: 'text', index: true, admin: { hidden: true } },
    { name: 'refundAmount', type: 'number', admin: { description: 'cents, CAD' } },
  ],
};

const Reviews: CollectionConfig = {
  slug: 'reviews',
  access: { read: ({ req }) => (has(req.user, 'admin') ? true : { status: { equals: 'published' } }), create: admin, update: admin, delete: admin },
  fields: [
    { name: 'studio', type: 'relationship', relationTo: 'studios', required: true, index: true },
    { name: 'author', type: 'text', required: true },
    { name: 'role', type: 'text' },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'date', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'status', type: 'select', defaultValue: 'published', options: ['published', 'reported', 'hidden'] },
  ],
};

const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title' },
  access: { read: anyone, create: admin, update: admin, delete: admin },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'title', type: 'text', required: true },
    { name: 'standfirst', type: 'text', required: true },
    { name: 'category', type: 'text', required: true },
    { name: 'date', type: 'text', required: true },
    { name: 'read', type: 'number', required: true },
    { name: 'photo', type: 'text', required: true },
    { name: 'author', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true, admin: { description: 'Paragraphs separated by a blank line' } },
    { name: 'studios', type: 'relationship', relationTo: 'studios', hasMany: true },
  ],
};

const Faqs: CollectionConfig = {
  slug: 'faqs',
  admin: { useAsTitle: 'q' },
  access: { read: anyone, create: admin, update: admin, delete: admin },
  fields: [{ name: 'group', type: 'text', required: true }, { name: 'q', type: 'text', required: true }, { name: 'a', type: 'textarea', required: true }, { name: 'order', type: 'number' }],
};

// Stripe webhook idempotency: one row per processed event id.
const StripeEvents: CollectionConfig = {
  slug: 'stripe-events',
  admin: { hidden: true },
  access: { read: admin, create: nobody, update: nobody, delete: admin },
  fields: [{ name: 'eventId', type: 'text', required: true, unique: true }, { name: 'type', type: 'text' }],
};

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  routes: { api: '/payload-api' },
  admin: { user: 'users', importMap: { baseDir: dirname }, meta: { titleSuffix: ' · SETSPACE admin' } },
  collections: [Users, Studios, Bookings, Reviews, Posts, Faqs, StripeEvents],
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI }, push: false, migrationDir: path.resolve(dirname, 'migrations') }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  graphQL: { disable: true },
  sharp,
});
