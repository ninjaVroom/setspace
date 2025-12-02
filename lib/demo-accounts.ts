// Demo accounts for the "Demo accounts" panel on /sign-in. Seeded by scripts/seed.ts. Test-only credentials.
export const DEMO_PASSWORD = 'setspace-demo-2026';
export const demoAccounts = [
  { role: 'guest', email: 'guest@setspace.test', name: 'Alex Morgan', label: 'Guest' },
  { role: 'host', email: 'host@setspace.test', name: 'Maya Lin', label: 'Host' },
  { role: 'admin', email: 'admin@setspace.test', name: 'Site admin', label: 'Admin' },
] as const;
export const otherHosts = [
  { email: 'jonah@setspace.test', name: 'Jonah Reid' },
  { email: 'dev@setspace.test', name: 'Dev Okafor' },
  { email: 'ines@setspace.test', name: 'Ines Duarte' },
];
// The one-click panel. Admin is left out in production: on a public demo anyone could otherwise wipe the data.
export const oneClickAccounts = demoAccounts.filter((a) => a.role !== 'admin' || process.env.NODE_ENV !== 'production');
