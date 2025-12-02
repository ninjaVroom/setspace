import Image from 'next/image';
import { redirect } from 'next/navigation';
import { photos } from '@/lib/data';
import { oneClickAccounts } from '@/lib/demo-accounts';
import { currentUser } from '@/lib/db';
import { SignInForm } from '@/components/client';
import { demoSignIn } from './actions';

export const metadata = { title: 'Sign in', robots: { index: false } };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const q = await searchParams;
  if (await currentUser()) redirect(q.next?.startsWith('/') && !q.next.startsWith('//') ? q.next : '/account');
  return (
    <div className="container auth">
      <Image src={photos.window} alt="" width={1536} height={1024} sizes="40vw" />
      <div className="auth-form">
        <h1>{q.mode === 'signup' ? 'Make an account.' : 'Welcome back.'}</h1>
        <SignInForm next={q.next ?? ''} mode={q.mode === 'signup' ? 'signup' : 'signin'} />
        <form className="demo" action={demoSignIn}>
          <strong>Demo accounts</strong>
          <p className="muted small">One click signs you in as a seeded test account.</p>
          {oneClickAccounts.map((a, i) => (
            <button key={a.role} className={i === 0 ? 'btn btn-block' : 'btn btn-line btn-block'} name="role" value={a.role} type="submit">
              {a.label}: {a.name}
            </button>
          ))}
        </form>
      </div>
    </div>
  );
}
