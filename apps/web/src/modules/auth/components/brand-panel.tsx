import './brand-panel.css';

export function BrandPanel() {
  return (
    <section className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_80%_110%,#2e86e0_0%,transparent_55%),radial-gradient(90%_70%_at_10%_0%,#cfe8ff_0%,transparent_60%),linear-gradient(180deg,#a9d6ff_0%,#6bb1f0_55%,#3e8bd8_100%)] px-14 pt-10 pb-12 text-white">
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="cloud c3" />
      <div className="cloud c4" />

      <div className="checkered-stripe" />

      <header className="relative z-10 flex items-center justify-between gap-5">
        <div className="inline-flex items-center gap-3 font-display text-[22px] font-extrabold -tracking-wide text-white">
          <span
            className="size-7 rounded-lg shadow-[0_4px_14px_rgba(11,27,51,0.25),inset_0_0_0_1px_rgba(255,255,255,0.4)]"
            style={{
              background: 'repeating-conic-gradient(#0b1b33 0% 25%, #ffffff 0% 50%) 50% / 12px 12px',
            }}
            aria-hidden="true"
          />
          <span>Lakitu</span>
        </div>
      </header>

      <div className="relative z-[2] mt-2 flex min-h-0 flex-1 flex-col justify-end">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[200px] z-[2] flex items-center justify-center">
          <img
            className="bob block h-auto max-h-full w-[min(60%,446px)] object-contain"
            src="/lakitu-world.png"
            alt="Lakitu waving the checkered flag"
          />
        </div>

        <div className="relative z-10 mt-auto max-w-[540px] pt-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[rgba(11,27,51,0.22)] px-2.5 py-1.5 font-mono text-[11.5px] font-semibold uppercase tracking-widest text-white/95 backdrop-blur-sm">
            <span className="pulse size-2 rounded-full bg-[#1f8a5b]" />
            Agent validation &amp; management
          </span>

          <h2 className="mt-3.5 mb-3 font-display text-[clamp(34px,3.4vw,48px)] font-bold leading-[1.04] -tracking-wide text-white text-balance">
            Start the run.
            <br />
            <em className="bg-gradient-to-b from-white to-[#ffe38c] bg-clip-text not-italic text-transparent">
              Wave the flag.
            </em>
          </h2>

          <p className="m-0 max-w-[44ch] text-[15.5px] leading-relaxed text-white/90">
            Lakitu officiates every agent run — kicking off evals, watching the track, and calling
            the finish. One source of truth for what your agents do, and how well they do it.
          </p>

          <div className="mt-5.5 flex gap-5.5 border-t border-white/[0.18] pt-4.5 text-xs text-white/[0.78]">
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-85" aria-hidden="true">
                <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12Z" />
              </svg>
              SOC 2 Type II
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-85" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
              GDPR &amp; HIPAA ready
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-85" aria-hidden="true">
                <path d="m9 12 2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              99.99% uptime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
