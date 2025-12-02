export default function Loading() {
  return (
    <div className="container" aria-busy="true" aria-label="Loading spaces">
      <div className="page-head"><div className="skeleton" style={{ height: 72, width: '40%' }} /></div>
      <div className="grid-cards" style={{ marginTop: 32 }}>
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ aspectRatio: '4 / 5' }} />)}
      </div>
    </div>
  );
}
