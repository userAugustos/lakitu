export function BrandPanel() {
  return (
    <section className="brand">
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="cloud c3" />
      <div className="cloud c4" />

      <header className="brand-top">
        <div className="wordmark">
          <span className="dot" aria-hidden="true" />
          <span>Lakitu</span>
        </div>
      </header>

      <div className="brand-body">
        <div className="lakitu-wrap">
          <img className="lakitu" src="/lakitu-world.png" alt="Lakitu waving the checkered flag" />
        </div>

        <div className="brand-copy">
          <span className="eyebrow">
            <span className="pulse" />
            Agent validation &amp; management
          </span>
          <h2 className="brand-title">
            Start the run.
            <br />
            <em>Wave the flag.</em>
          </h2>
          <p className="brand-sub">
            Lakitu officiates every agent run — kicking off evals, watching the track, and calling
            the finish. One source of truth for what your agents do, and how well they do it.
          </p>

          <div className="brand-foot">
            <span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12Z" />
              </svg>
              SOC 2 Type II
            </span>
            <span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
              GDPR &amp; HIPAA ready
            </span>
            <span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
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
