export function BrandFloat() {
  return (
    <div
      className="fixed top-5 left-6 z-20 inline-flex items-center gap-2.5"
      aria-label="Lakitu"
      data-testid="brand-float"
    >
      <img
        src="/flag.svg"
        alt=""
        className="h-[26px] w-[26px] rounded-lg"
        aria-hidden="true"
        style={{
          boxShadow: '0 2px 8px rgba(11,27,51,0.18), inset 0 0 0 1px rgba(11,27,51,0.06)',
        }}
      />
      <span className="font-display text-dash-ink text-xl font-[800] tracking-tight">Lakitu</span>
    </div>
  );
}
