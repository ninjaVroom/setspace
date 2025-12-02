import { ContactForm } from '@/components/client';

export const metadata = { title: 'Contact' };

export default function Contact() {
  return (
    <div className="container contact">
      <div>
        <h1 style={{ fontSize: 'var(--text-display-l)' }}>Talk to a person.</h1>
        <p className="muted" style={{ marginTop: 16, fontSize: '1.125rem' }}>Questions about a booking, a listing or the press. We reply within a working day.</p>
      </div>
      <ContactForm />
    </div>
  );
}
