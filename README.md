# Setspace

Samuel Vroom

A Canadian studio-booking demo with space listings, availability, guest checkout and a host view.

## Case study

Two guests can request the same room before either browser sees the other's booking. Checking availability in the interface cannot settle that race. Setspace adds a PostgreSQL exclusion constraint for overlapping active bookings. One insert succeeds; a conflicting insert returns a slot-taken response.

Checkout creates a ten-minute hold. An instant booking confirms after payment. A request-to-book studio authorises the card and waits for the host to accept before capture. Expired holds stop blocking availability. The test suite checks overlap rules, pricing, cancellation calculations and local times around daylight-saving changes.

Studios store their own IANA time zone. Bookings are saved as UTC instants and displayed in the studio's local time. Prices use Canadian dollars and integer cents, with tax based on the studio's province. Maps show a neighbourhood centre rather than the room's street address.

The database holds studios, users and bookings through Payload. Booking pages require the guest's access token or an allowed session. Guests, hosts and administrators have different access. All listings, bookings and reviews are demo data; Stripe is restricted to test mode. Email delivery, production media uploads and completed-booking jobs remain stand-ins or unfinished work.

## Run locally

Use Node.js 22.23.4 or a compatible newer release and npm. Copy `.env.example` to `.env.local` and replace `PAYLOAD_SECRET` with a long random value.

```sh
npm ci
npm run db
```

Keep the local database running. In a second terminal:

```sh
npm run migrate
npm run seed
npm run dev
```

The seed command replaces data in the configured database. Use a new local demo database. Open `http://localhost:3000`. Demo guest and host accounts are available from Sign in; their values are in `lib/demo-accounts.ts`.

```sh
npm test
npm run test:db
```

The database check requires the migrated local database. Without Stripe test keys, checkout uses a labelled test-card form. `.env.example` lists the optional test keys and webhook secret.

## Source

`lib/booking.ts` holds booking and pricing rules. `app/api/bookings/` handles booking requests. `migrations/` includes the overlap constraint. `scripts/constraint.test.ts` checks concurrent inserts against PostgreSQL. The app also has a `/case-study` page.

## Prototype

Figma prototype link pending.
