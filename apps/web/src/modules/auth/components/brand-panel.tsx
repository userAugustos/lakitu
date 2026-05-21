import { CheckeredStripe } from './checkered-stripe';
import { Cloud } from './cloud';
import { LakituLogo } from './lakitu-logo';

export function BrandPanel() {
  return (
    <div className="brand">
      <div className="brand-sky" />
      <Cloud style={{ top: 80, left: -40 }} scale={0.8} opacity={0.9} />
      <Cloud style={{ top: 220, right: -60 }} scale={1.1} opacity={0.85} />
      <Cloud style={{ bottom: 180, left: 40 }} scale={0.6} opacity={0.7} />
      <Cloud style={{ bottom: 60, right: 80 }} scale={0.9} opacity={0.6} />

      <div className="brand-top">
        <div className="brand-mark">
          <LakituLogo size={32} />
          <span className="brand-wordmark">Lakitu</span>
        </div>
        <div className="brand-pill">
          <span className="dot" />
          Agent control tower
        </div>
      </div>

      <div className="brand-stage">
        <div className="mascot-frame">
          <div className="mascot-halo" />
          <img src="/lakitu-world.png" alt="Lakitu mascot" className="mascot-img" />
          <div className="mascot-flag">
            <svg width="64" height="120" viewBox="0 0 64 120" aria-hidden="true">
              <rect x="30" y="0" width="2.4" height="120" fill="#0e1726" />
              <g transform="translate(0,6)">
                <rect x="0" y="0" width="32" height="22" fill="#ffffff" />
                <rect x="0" y="0" width="8" height="5.5" fill="#0e1726" />
                <rect x="16" y="0" width="8" height="5.5" fill="#0e1726" />
                <rect x="8" y="5.5" width="8" height="5.5" fill="#0e1726" />
                <rect x="24" y="5.5" width="8" height="5.5" fill="#0e1726" />
                <rect x="0" y="11" width="8" height="5.5" fill="#0e1726" />
                <rect x="16" y="11" width="8" height="5.5" fill="#0e1726" />
                <rect x="8" y="16.5" width="8" height="5.5" fill="#0e1726" />
                <rect x="24" y="16.5" width="8" height="5.5" fill="#0e1726" />
              </g>
            </svg>
          </div>
        </div>

        <div className="brand-copy">
          <h1>
            Start the match.
            <br />
            <span className="brand-muted">Validate every agent.</span>
          </h1>
          <p>
            Lakitu watches the line — running evals, gating deploys, and waving in agents that pass.
            Sign in to manage your fleet.
          </p>
        </div>
      </div>

      <div className="brand-flag-stripe">
        <CheckeredStripe rows={2} cols={36} cell={22} />
      </div>
    </div>
  );
}
