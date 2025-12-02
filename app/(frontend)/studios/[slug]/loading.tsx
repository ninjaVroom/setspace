export default function Loading() {
  return (
    <div className="container" aria-busy="true" aria-label="Loading studio" style={{ paddingTop: 48 }}>
      <div className="skeleton" style={{ height: 'clamp(320px, 38vw, 560px)' }} />
      <div className="skeleton" style={{ height: 56, width: '50%', marginTop: 32 }} />
    </div>
  );
}
