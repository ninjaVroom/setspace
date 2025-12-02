'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { oneClickAccounts, DEMO_PASSWORD } from '@/lib/demo-accounts';

export type AuthState = { error?: string; email?: string; name?: string };
const safeNext = (n: unknown) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/account');

// In production the site is embedded in the portfolio (another domain), so the session cookie has to be
// SameSite=None and partitioned (CHIPS) or browsers drop it inside the iframe. Locally, plain Lax over http.
const prod = process.env.NODE_ENV === 'production';
const cookieOpts = prod
  ? ({ httpOnly: true, sameSite: 'none', secure: true, partitioned: true, path: '/' } as const)
  : ({ httpOnly: true, sameSite: 'lax', secure: false, path: '/' } as const);

async function login(email: string, password: string) {
  const db = await getDb();
  const r = await db.login({ collection: 'users', data: { email, password } });
  if (!r.token) throw new Error('no_token');
  (await cookies()).set(`${db.config.cookiePrefix}-token`, r.token, { ...cookieOpts, expires: r.exp ? new Date(r.exp * 1000) : undefined });
  return r.user as unknown as { roles?: string[] };
}

const Creds = z.object({ email: z.email().max(160), password: z.string().min(1).max(200) });
const SignUp = Creds.extend({ name: z.string().trim().min(1).max(80), password: z.string().min(10, 'Use at least 10 characters.').max(200) });

// no rate limit on login yet; Payload's maxLoginAttempts + lockTime is the next step before going public.
export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const mode = form.get('mode');
  const email = String(form.get('email') ?? '');
  if (mode === 'signup') {
    const p = SignUp.safeParse({ email, password: form.get('password'), name: form.get('name') });
    if (!p.success) return { error: p.error.issues[0].message.startsWith('Use') ? p.error.issues[0].message : 'Check your name, email and password.', email, name: String(form.get('name') ?? '') };
    const db = await getDb();
    const taken = await db.count({ collection: 'users', where: { email: { equals: p.data.email.toLowerCase() } } });
    if (taken.totalDocs) return { error: 'There is already an account with that email. Sign in instead.', email };
    await db.create({ collection: 'users', data: { email: p.data.email, password: p.data.password, name: p.data.name } });
    await login(p.data.email, p.data.password);
    redirect(safeNext(form.get('next')));
  }
  const p = Creds.safeParse({ email, password: form.get('password') });
  if (!p.success) return { error: 'Enter your email and password.', email };
  try {
    await login(p.data.email, p.data.password);
  } catch {
    return { error: 'That email and password don’t match.', email };
  }
  redirect(safeNext(form.get('next')));
}

export async function demoSignIn(form: FormData) {
  const a = oneClickAccounts.find((x) => x.role === form.get('role'));
  if (!a) return;
  await login(a.email, DEMO_PASSWORD);
  redirect(a.role === 'host' ? '/host' : a.role === 'admin' ? '/admin' : '/account');
}

export async function signOut() {
  const db = await getDb();
  // A partitioned cookie is only cleared by a cookie with the same attributes, so expire it rather than delete().
  (await cookies()).set(`${db.config.cookiePrefix}-token`, '', { ...cookieOpts, maxAge: 0 });
  redirect('/');
}
