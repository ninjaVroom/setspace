// Demo seed data for scripts/seed.ts. Every studio, price, spec and review here is demo data and the footer says so.
import { photos, type Studio, type Review, type Post } from '../lib/data';
const { hero, pod, film, atelier, arch, roof, grip, window, plaster } = photos;

const noise: [string, string] = ['Noise', 'Amplified music until 8 pm. The neighbours below are a joinery shop.'];

export const studios: Omit<Studio, 'id' | 'hostId'>[] = [
  {
    slug: 'lumora', name: 'Lumora Studio', category: 'daylight', city: 'Toronto', area: 'Fashion District', postcode: 'M5V', province: 'ON', tz: 'America/Toronto',
    photo: hero, gallery: [hero, atelier, plaster, arch, grip], alt: 'Brick warehouse studio with tall steel windows and a white cyc wall',
    hourly: 85, minHours: 2, discount8h: 15, cleaningFee: 0, m2: 120, ceiling: 4.2, capacity: 12, light: 'North',
    mode: 'instant', tier: 'flexible', open: 8, close: 22, host: 'Maya Lin', featured: true, lat: 43.6489, lng: -79.3987,
    blurb: 'Top floor of a 1920s garment factory with a 6 m cyc wall.',
    space: [
      'Lumora takes the top floor of a 1920s garment factory off Spadina Avenue. Four 3.4 m steel windows face true north, so the light across the 6 m × 4.5 m cyc wall stays even from 8:30 am until dusk.',
      'Motorised blinds take the room to full dark in 25 seconds. Every booking includes three Profoto D2 heads, a steamer and a hair and make-up station with daylight mirrors.',
    ],
    pull: 'North light until 4 pm, full blackout in twenty-five seconds.',
    lit: 'Four north windows, 3.4 m × 2.8 m, no direct sun. Blackout blinds on every window. Kit: 3× Profoto D2 1000 Ws, 2 softboxes, 4 C-stands, 2 black and white V-flats.',
    included: ['6 m × 4.5 m cyc wall', '3× Profoto D2 heads', '1 Gbps Wi-Fi', 'Motorised blackout', 'Freight elevator', 'Steamer and 3 rails', 'Hair and make-up station', '200 A three-phase power'],
    rules: [noise, ['Haze and smoke', 'Haze allowed with the detectors bypassed by building staff; book 48 hrs ahead.'], ['Food and drink', 'Anywhere but the cyc.'], ['Pets', 'Allowed on set. Tell the host first.'], ['Load-in and parking', 'Freight elevator to the door, 1,200 kg. Green P lot on Richmond, 2 min.']],
    transit: '510 Spadina streetcar, 3 min walk. Osgoode station, 10 min.',
  },
  {
    slug: 'low-tide', name: 'Low Tide Podcast', category: 'podcast', city: 'Montréal', area: 'Mile End', postcode: 'H2T', province: 'QC', tz: 'America/Toronto',
    photo: pod, gallery: [pod, atelier, grip, plaster, window], alt: 'Wood-panelled podcast room with a round table, two mic arms and a pendant lamp',
    hourly: 95, minHours: 2, discount8h: 10, cleaningFee: 0, m2: 28, ceiling: 3.0, capacity: 6, light: 'None',
    mode: 'instant', tier: 'moderate', open: 9, close: 23, host: 'Jonah Reid', featured: true, lat: 45.5245, lng: -73.6005,
    blurb: 'A treated room for four voices and two cameras.',
    space: [
      'A floated room inside a former textile print shop on Saint-Viateur. Slatted oak over rockwool takes the decay to 0.18 s, so voices sound close without a booth.',
      'Four Shure SM7Bs on arms, a RodeCaster Pro II and two Sony FX3s on sticks. You leave with the files on a drive or a link. Sessions in English or French.',
    ],
    pull: 'Quiet enough to hear the pages turn.',
    lit: 'No windows. Three dimmable LED panels at 3200–5600 K and a warm pendant over the table.',
    included: ['4× Shure SM7B', 'RodeCaster Pro II', '2× Sony FX3', 'Dimmable LED panels', 'Green room', 'Files on the day'],
    rules: [['Noise', 'The room is isolated. Keep the door shut while the room next door records.'], ['Food and drink', 'Drinks with lids only at the table.'], ['Pets', 'Not allowed.'], ['Load-in and parking', 'Ground floor, no steps. Street parking is permit-only; take the métro.']],
    transit: 'Laurier métro, 9 min walk. The 55 bus stops on Saint-Laurent.',
  },
  {
    slug: 'ferro', name: 'Ferro Stage', category: 'film', city: 'Toronto', area: 'Port Lands', postcode: 'M4M', province: 'ON', tz: 'America/Toronto',
    photo: film, gallery: [film, grip, hero, plaster, arch], alt: 'Dark warehouse film stage with a black drape and a large softbox overhead',
    hourly: 220, minHours: 4, discount8h: 15, cleaningFee: 100, m2: 340, ceiling: 6.5, capacity: 35, light: 'Blackout',
    mode: 'instant', tier: 'strict', open: 7, close: 23, host: 'Dev Okafor', featured: true, lat: 43.6505, lng: -79.3340,
    blurb: 'A 340 m² blacked-out shed with a drive-in door.',
    space: [
      'A 1930s shipping warehouse in the Port Lands, blacked out, with a 6.5 m grid and a 4 m drive-in door. Bring the cube truck inside.',
      'Black and white drapes run on tracks around three walls. The power is 400 A three-phase with distro on the floor.',
    ],
    pull: 'Drive the truck in, close the door, it is night.',
    lit: 'Full blackout. Overhead grid with 12 hoist points. House kit: 4× Aputure 600d, a 12×12 frame with ultrabounce, and a 6 m track.',
    included: ['6.5 m lighting grid', '4 m drive-in door', '400 A three-phase', '4× Aputure 600d', '12×12 frame', 'Drapes on tracks', 'Production office', 'Crew parking for 8'],
    rules: [['Noise', 'Any level. It is the Port Lands.'], ['Haze and smoke', 'Haze and smoke allowed.'], ['Food and drink', 'Catering area by the office.'], ['Pets', 'Allowed.'], ['Load-in and parking', 'Drive-in door, 8 crew spots, room for a 26 ft truck.']],
    transit: '72 Pape bus, 6 min walk. Free crew parking on site.',
  },
  {
    slug: 'atelier-row', name: 'Atelier Row', category: 'workspace', city: 'Toronto', area: 'Leslieville', postcode: 'M4M', province: 'ON', tz: 'America/Toronto',
    photo: atelier, gallery: [atelier, window, hero, pod, plaster], alt: 'Loft workspace with a long timber table and stools in low sun',
    hourly: 110, minHours: 2, discount8h: 15, cleaningFee: 0, m2: 85, ceiling: 3.8, capacity: 14, light: 'East and south',
    mode: 'instant', tier: 'flexible', open: 8, close: 20, host: 'Maya Lin', featured: true, lat: 43.6626, lng: -79.3335,
    blurb: 'A long table, a kitchen and morning sun for workshops.',
    space: [
      'A 6 m white-oak table for fourteen, a working kitchen and windows on two sides. Morning sun on the table until 11 am.',
      'Good for table reads, workshops and food shoots. The kitchen has a six-burner gas range and two ovens.',
    ],
    pull: 'Morning sun on a six-metre table.',
    lit: 'East and south windows, sun on the table until 11 am. Sheer blinds; no blackout.',
    included: ['6 m oak table', 'Working kitchen', 'Projector and screen', '1 Gbps Wi-Fi', 'Whiteboard wall', 'Coffee'],
    rules: [noise, ['Food and drink', 'Cooking welcome. Leave the range clean.'], ['Pets', 'Not allowed.'], ['Load-in and parking', 'Two flights of stairs, no elevator. Street parking on Logan.']],
    transit: '501 Queen streetcar, 4 min walk.',
  },
  {
    slug: 'blue-hour-roof', name: 'Blue Hour Roof', category: 'daylight', city: 'Vancouver', area: 'Yaletown', postcode: 'V6B', province: 'BC', tz: 'America/Vancouver',
    photo: roof, gallery: [roof, hero, arch, window, atelier], alt: 'Glass rooftop pavilion and terrace at dusk with the city skyline behind',
    hourly: 150, minHours: 3, discount8h: 10, cleaningFee: 75, m2: 160, ceiling: 3.6, capacity: 20, light: 'All round',
    mode: 'request', tier: 'moderate', open: 10, close: 23, host: 'Ines Duarte', featured: true, lat: 49.2754, lng: -123.1216,
    blurb: 'A glass pavilion and terrace with the skyline behind.',
    space: [
      'A glass pavilion on the ninth floor with a 90 m² terrace. The downtown towers run along the north side, the North Shore mountains behind them.',
      'Booked mostly for the 40 minutes after sunset. The host sends the exact blue-hour time with your confirmation.',
    ],
    pull: 'Book the forty minutes after sunset.',
    lit: 'Glass on four sides, sun all day. The terrace faces north-west, so the sun sets over English Bay.',
    included: ['90 m² terrace', 'Glass pavilion', 'Elevator to the roof', 'Outdoor power', 'Patio heaters', 'Washrooms and green room'],
    rules: [['Noise', 'Amplified sound until 10 pm.'], ['Haze and smoke', 'Not allowed.'], ['Food and drink', 'Allowed. No glass on the terrace.'], ['Load-in and parking', 'Service elevator, 1,000 kg. Loading bay for 30 minutes.']],
    transit: 'Yaletown–Roundhouse SkyTrain, 4 min walk.',
  },
  {
    slug: 'hollow-room', name: 'Hollow Room', category: 'daylight', city: 'Toronto', area: 'Little Portugal', postcode: 'M6J', province: 'ON', tz: 'America/Toronto',
    photo: plaster, gallery: [plaster, arch, hero, window, atelier], alt: 'Empty room with warm plaster walls and soft side light',
    hourly: 90, minHours: 2, discount8h: 15, cleaningFee: 0, m2: 64, ceiling: 3.9, capacity: 8, light: 'West',
    mode: 'request', tier: 'flexible', open: 9, close: 21, host: 'Maya Lin', featured: false, lat: 43.6487, lng: -79.4262,
    blurb: 'Bare lime plaster and late west light.',
    space: [
      'An empty room above a bakery on Dundas West, with hand-trowelled lime plaster on every wall. Nothing to move before you shoot.',
      'West windows bring in low sun from about 3 pm, which turns the plaster gold.',
    ],
    pull: 'Nothing to move before you shoot.',
    lit: 'Two west windows with low sun from 3 pm. Linen blinds soften it; no blackout.',
    included: ['Lime plaster walls', 'Linen blinds', '2 C-stands', 'Steamer', 'Changing area'],
    rules: [['Noise', 'Quiet residential street. No amplified music.'], ['Food and drink', 'Kitchen next door only.'], ['Pets', 'Allowed.'], ['Load-in and parking', 'Ground floor, one step. Green P on Ossington.']],
    transit: '505 Dundas streetcar, 2 min walk. Ossington station, 12 min.',
  },
  {
    slug: 'the-annex', name: 'The Annex', category: 'daylight', city: 'Toronto', area: 'Junction Triangle', postcode: 'M6H', province: 'ON', tz: 'America/Toronto',
    photo: arch, gallery: [arch, plaster, hero, roof, grip], alt: 'Limestone arches and two leather armchairs under a paper pendant in raking sun',
    hourly: 125, minHours: 3, discount8h: 15, cleaningFee: 50, m2: 145, ceiling: 4.8, capacity: 16, light: 'South-west',
    mode: 'instant', tier: 'moderate', open: 8, close: 21, host: 'Maya Lin', featured: true, lat: 43.6620, lng: -79.4470,
    blurb: 'Limestone arches in a former printworks, sun until 5 pm.',
    space: [
      'The annex of a 1910s printworks by the rail corridor: south-west limestone arches and a 6 m infinity cove.',
      'Raking afternoon sun until 5 pm, 200 A three-phase power and street-level load-in.',
    ],
    pull: 'Raking sun across stone until five.',
    lit: 'Three south-west arched windows. Direct sun from 1 pm to 5 pm in spring and summer.',
    included: ['Limestone walls', '6 m infinity cove', '200 A three-phase', 'Street-level load-in', '2 leather armchairs', 'Paper pendant'],
    rules: [noise, ['Haze and smoke', 'Haze only.'], ['Food and drink', 'Allowed off the cove.'], ['Load-in and parking', 'Roll-up door to the street. One spot.']],
    transit: 'Bloor GO and UP Express, 5 min walk. Lansdowne station, 9 min.',
  },
  {
    slug: 'cyc-nine', name: 'Cyc Nine', category: 'film', city: 'Montréal', area: 'Saint-Henri', postcode: 'H4C', province: 'QC', tz: 'America/Toronto',
    photo: grip, gallery: [grip, film, hero, plaster, atelier], alt: 'Lighting stands, flags and grip gear lined up against a studio wall',
    hourly: 120, minHours: 3, discount8h: 15, cleaningFee: 50, m2: 210, ceiling: 5.5, capacity: 25, light: 'Blackout',
    mode: 'instant', tier: 'moderate', open: 8, close: 22, host: 'Dev Okafor', featured: false, lat: 45.4775, lng: -73.5870,
    blurb: 'A blackout stage with a full grip room.',
    space: ['A mill floor by the Lachine Canal turned stage, with a full grip room in the corner.', 'Flags, frames, stands and dollies are included with every booking.'],
    pull: 'The grip room is included.',
    lit: 'Full blackout. Grip room with 20 C-stands, flags, a 6×6 and an 8×8 frame.',
    included: ['Grip room', '5.5 m ceiling', 'Blackout', 'Dolly and track', 'Production office'],
    rules: [['Noise', 'Any level.'], ['Haze and smoke', 'Allowed.'], ['Load-in and parking', 'Freight elevator, 2,000 kg. Yard parking for 4.']],
    transit: 'Place-Saint-Henri métro, 6 min walk.',
  },
  {
    slug: 'glasshouse', name: 'Glasshouse', category: 'workspace', city: 'Calgary', area: 'Inglewood', postcode: 'T2G', province: 'AB', tz: 'America/Edmonton',
    photo: window, gallery: [window, atelier, plaster, arch, hero], alt: 'Window light falling across a pale wall and floor',
    hourly: 60, minHours: 2, discount8h: 10, cleaningFee: 0, m2: 55, ceiling: 3.4, capacity: 10, light: 'South',
    mode: 'request', tier: 'flexible', open: 8, close: 20, host: 'Ines Duarte', featured: false, lat: 51.0383, lng: -114.0196,
    blurb: 'A bright room for small workshops and still life.',
    space: ['A second-floor room on 9 Avenue with three south windows and pale maple floors.', 'Tables and chairs for ten, or clear it for still life. Prairie light, most days of the year.'],
    pull: 'Three south windows and nothing else.',
    lit: 'Three south windows, direct sun most of the day. Sheer blinds.',
    included: ['Tables for 10', '1 Gbps Wi-Fi', 'Sheer blinds', 'Kitchenette'],
    rules: [['Noise', 'No amplified music.'], ['Load-in and parking', 'One flight of stairs. Free street parking after 6 pm.']],
    transit: 'Route 1 bus, 3 min walk. Victoria Park/Stampede CTrain, 15 min.',
  },
];

export const reviews: Review[] = [
  { studio: 'lumora', author: 'Clara V.', role: 'Editorial photographer', rating: 5, date: 'Mar 2026', body: 'The 4.2 m ceiling and the north windows are as listed. We shot 14 looks on daylight alone, then dropped the blinds for two strobe set-ups.' },
  { studio: 'lumora', author: 'Marcus T.', role: 'Producer', rating: 5, date: 'Feb 2026', body: 'The goods lift opens onto the studio floor. Four Peli cases and a rail were up in five minutes. The cyc was freshly painted.' },
  { studio: 'lumora', author: 'Priya S.', role: 'Stylist', rating: 4, date: 'Jan 2026', body: 'Light is lovely until about 3 pm in a Toronto winter. Plan the hero shots early.' },
  { studio: 'low-tide', author: 'Ben A.', role: 'Podcast host', rating: 5, date: 'Mar 2026', body: 'No echo at all. We left with four isolated tracks and both camera angles on a drive.' },
  { studio: 'ferro', author: 'Hana K.', role: 'Director', rating: 5, date: 'Feb 2026', body: 'Drove the picture car straight in. Truly dark at noon.' },
  { studio: 'the-annex', author: 'Tom W.', role: 'Photographer', rating: 5, date: 'Mar 2026', body: 'The sun across the stone at four is the reason to book it.' },
  { studio: 'blue-hour-roof', author: 'Lena M.', role: 'Videographer', rating: 4, date: 'Oct 2025', body: 'Ines sent the exact sunset time. Windy off English Bay, bring sandbags.' },
  { studio: 'atelier-row', author: 'Sam V.', role: 'Food stylist', rating: 5, date: 'Jan 2026', body: 'The kitchen is a real kitchen. Morning sun on the table did the work.' },
];

export const posts: Post[] = [
  {
    slug: 'light-a-small-studio-with-one-window', title: 'How to light a small studio with one window', category: 'Lighting', date: '2 Nov 2026', read: 6, photo: window, author: 'Maya Lin', studios: ['lumora', 'hollow-room'],
    standfirst: 'One north window, a white polyboard and a black flag will take a portrait further than a van of rented heads.',
    body: [
      'Start by finding where the light falls off. Stand your subject a metre from the window and take a reading, then step back another metre. You will lose about two stops. That falloff is what makes window light look like window light.',
      'Turn the subject 45° to the glass. The far cheek drops into shadow, and now you have something to shape. A white polyboard on that side lifts the shadow; a black one deepens it. Swap them and watch the face change.',
      'North light is the easy kind: it does not move much and never turns harsh. If your window faces south, hang a sheet of diffusion over the glass and you have the same thing until the sun goes round.',
      'When you do add a strobe, put it where the window is. Same height, same angle, same side. The eye accepts one light source; it argues with two.',
    ],
  },
  {
    slug: 'what-a-podcast-room-needs', title: 'What a podcast room actually needs', category: 'Sound', date: '19 Oct 2026', read: 5, photo: pod, author: 'Jonah Reid', studios: ['low-tide'],
    standfirst: 'Not foam pyramids. A short decay time, a quiet floor and chairs that do not creak.',
    body: [
      'The number to ask about is RT60: how long a sound takes to fade by 60 dB. Under 0.3 seconds and voices sound close. Most living rooms sit near 0.6.',
      'Soft furnishings help more than foam. Books, curtains and a rug do most of the work in a small room.',
      'Then listen for the floor. Traffic and footsteps come up through the structure, and no panel on the wall will stop them.',
    ],
  },
  {
    slug: 'cyc-walls-explained', title: 'Cyc walls, explained', category: 'Studios', date: '5 Oct 2026', read: 4, photo: hero, author: 'Maya Lin', studios: ['lumora', 'the-annex'],
    standfirst: 'Why a curved corner makes a room look endless, and what to ask before you book one.',
    body: [
      'A cyclorama curves the wall into the floor so the camera cannot find the corner. Lit evenly, the background disappears.',
      'Ask three things: how wide, how fresh the paint is, and whether shoes are allowed on the floor section.',
    ],
  },
  {
    slug: 'pricing-quiet-hours', title: "Pricing your studio's quiet hours", category: 'Hosting', date: '21 Sep 2026', read: 5, photo: plaster, author: 'Ines Duarte', studios: ['hollow-room'],
    standfirst: 'Tuesday mornings sit empty in most studios. A four-hour bundle fills them.',
    body: [
      'Look at your weekday occupancy before you change a price. If Tuesday and Wednesday mornings sit under half full, that is the gap.',
      'Offer a four-hour morning block at a lower rate. It suits podcasts and product shoots that never needed the afternoon light anyway.',
    ],
  },
];

export const faqs: { group: string; q: string; a: string }[] = [
  { group: 'Booking', q: 'What is the difference between instant and request?', a: 'Instant book confirms and charges straight away. Request to book places a hold on your card; the host has 24 hrs to accept, and the hold is released if they decline.' },
  { group: 'Booking', q: 'Can someone else book my time while I pay?', a: 'No. When you continue to payment we hold the slot for 10 minutes. The database will not accept a second booking that overlaps it.' },
  { group: 'Payments', q: 'When am I charged?', a: 'Instant bookings are charged when you confirm. Requests are authorised and only charged when the host accepts.' },
  { group: 'Payments', q: 'What is the service fee?', a: '10% of the booking, shown in the total before you pay. There are no other fees.' },
  { group: 'Payments', q: 'Are taxes included?', a: 'Prices are in Canadian dollars, before tax. Checkout adds the tax for the studio’s province: HST in Ontario, GST and QST in Québec, GST in British Columbia and Alberta.' },
  { group: 'Cancellations', q: 'How do refunds work?', a: 'Flexible: full refund up to 24 hrs before. Moderate: full refund up to 7 days before, half after that until 24 hrs before. Strict: half refund up to 7 days before.' },
  { group: 'Cancellations', q: 'I booked by mistake.', a: 'Cancel within 24 hrs of booking for a full refund, as long as the booking is more than 48 hrs away.' },
  { group: 'Hosting', q: 'What does it cost to list?', a: 'Nothing. Hosts are paid 24 hrs after each booking ends.' },
  { group: 'Account', q: 'How do I switch to dark mode?', a: 'Use the Appearance control in the footer or in your account settings.' },
];

export const DEMO_GUEST = 'Alex Morgan';
export const DEMO_HOST = 'Maya Lin';
