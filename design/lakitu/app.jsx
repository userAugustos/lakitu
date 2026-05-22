const { useState, useEffect, useRef } = React;

function CheckeredStripe({ rows = 2, cols = 28, cell = 22 }) {
  const squares = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dark = (r + c) % 2 === 0;
      squares.push(
        <rect
          key={`${r}-${c}`}
          x={c * cell}
          y={r * cell}
          width={cell}
          height={cell}
          fill={dark ? '#0e1726' : '#ffffff'}
        />
      );
    }
  }
  return (
    <svg
      width="100%"
      height={rows * cell}
      viewBox={`0 0 ${cols * cell} ${rows * cell}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      {squares}
    </svg>
  );
}

function Cloud({ style, scale = 1, opacity = 1 }) {
  return (
    <svg
      width={220 * scale}
      height={90 * scale}
      viewBox="0 0 220 90"
      style={{ position: 'absolute', opacity, ...style }}
      aria-hidden="true"
    >
      <g fill="#ffffff">
        <ellipse cx="50" cy="60" rx="42" ry="28" />
        <ellipse cx="95" cy="48" rx="40" ry="34" />
        <ellipse cx="140" cy="42" rx="38" ry="36" />
        <ellipse cx="180" cy="58" rx="34" ry="26" />
        <rect x="40" y="60" width="150" height="22" />
      </g>
      <g fill="#0e1726" opacity="0.06">
        <ellipse cx="50" cy="76" rx="38" ry="6" />
        <ellipse cx="120" cy="80" rx="80" ry="6" />
      </g>
    </svg>
  );
}

function LakituLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="lk-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc6ff" />
          <stop offset="1" stopColor="#3a8fe0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#lk-sky)" />
      {/* cloud */}
      <g fill="#ffffff">
        <ellipse cx="16" cy="30" rx="8" ry="6" />
        <ellipse cx="24" cy="26" rx="9" ry="7" />
        <ellipse cx="32" cy="30" rx="7" ry="5" />
        <rect x="14" y="29" width="20" height="6" />
      </g>
      {/* flag pole + checkered flag */}
      <rect x="33" y="8" width="1.6" height="18" fill="#0e1726" />
      <g>
        <rect x="24" y="8" width="9" height="7" fill="#ffffff" />
        <rect x="24" y="8" width="3" height="3.5" fill="#0e1726" />
        <rect x="30" y="8" width="3" height="3.5" fill="#0e1726" />
        <rect x="27" y="11.5" width="3" height="3.5" fill="#0e1726" />
      </g>
    </svg>
  );
}

function BrandPanel() {
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
          <image-slot
            id="lakitu-mascot"
            shape="rounded"
            radius="32"
            placeholder="Drop mascot art here"
            style={{ width: 360, height: 360, position: 'relative', zIndex: 2 }}
          ></image-slot>
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
            <span className="muted">Validate every agent.</span>
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

function EmailStep({ email, setEmail, onSubmit, error }) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit();
      }}
    >
      <label className="field-label" htmlFor="email">
        Work email
      </label>
      <input
        id="email"
        className="text-input"
        type="email"
        autoFocus
        autoComplete="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <div className="field-error">{error}</div>}

      <button type="submit" className="primary-btn" disabled={!valid}>
        <span>Send one-time code</span>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M3 8h9.5M9 4.5l4 3.5-4 3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="divider">
        <span>or</span>
      </div>

      <button type="button" className="ghost-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.22-4.74 3.22-8.32z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        Continue with Google SSO
      </button>

      <button type="button" className="ghost-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#0e1726"
            d="M11.5 0h1l.2 2.3c2.3 0 4.5.8 6.3 2.3l1.6-1.6 1 .7-1.4 2C22 7.5 23 10.2 23 13c0 6.1-5 11-11 11S1 19.1 1 13c0-2.8 1-5.5 2.8-7.4l-1.4-2 1-.7L5 4.7C6.8 3.1 9 2.3 11.3 2.3L11.5 0zM12 22c5 0 9-4 9-9s-4-9-9-9-9 4-9 9 4 9 9 9zm-.5-13l3 3v3h-4V9.5l1-.5z"
          />
        </svg>
        Continue with SAML
      </button>
    </form>
  );
}

function OtpStep({ email, onBack, onVerify }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(30);
  const [verifying, setVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const filled = digits.every((d) => d !== '');

  useEffect(() => {
    if (!filled || verifying) return;
    setVerifying(true);
    const t = setTimeout(() => {
      if (digits.join('') === '424242') {
        onVerify();
      } else {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setDigits(['', '', '', '', '', '']);
          setVerifying(false);
          refs.current[0]?.focus();
        }, 500);
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [filled]);

  function handleChange(i, v) {
    const clean = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKey(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  }

  function handlePaste(e) {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  return (
    <div className="form">
      <button className="back-link" onClick={onBack} type="button">
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M10 3l-5 5 5 5"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Use a different email
      </button>

      <div className="otp-meta">
        <div className="otp-label">Enter the 6-digit code</div>
        <div className="otp-sub">
          Sent to <strong>{email}</strong>
        </div>
      </div>

      <div className={`otp-row ${shake ? 'shake' : ''}`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            className={`otp-cell ${d ? 'filled' : ''} ${verifying ? 'locked' : ''}`}
            value={d}
            inputMode="numeric"
            maxLength={1}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            disabled={verifying && !shake}
          />
        ))}
      </div>

      <div className="otp-footer">
        {seconds > 0 ? (
          <span className="muted">
            Resend code in <strong>0:{seconds.toString().padStart(2, '0')}</strong>
          </span>
        ) : (
          <button type="button" className="link-btn" onClick={() => setSeconds(30)}>
            Resend code
          </button>
        )}
        <span className="muted dot-sep">·</span>
        <span className="muted">
          Hint: <code>424242</code>
        </span>
      </div>

      {verifying && !shake && (
        <div className="verify-state">
          <div className="spinner" />
          Verifying code…
        </div>
      )}
    </div>
  );
}

function SuccessStep({ email }) {
  return (
    <div className="form success">
      <div className="success-badge">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="17" fill="none" stroke="#0e1726" strokeWidth="1.5" />
          <path
            d="M10 18.5l5 5 11-11"
            fill="none"
            stroke="#0e1726"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2>Green flag.</h2>
      <p className="muted">
        Welcome back. Routing <strong>{email}</strong> to the control tower…
      </p>
      <div className="loader-bar">
        <div className="loader-fill" />
      </div>
    </div>
  );
}

function LoginCard() {
  const [step, setStep] = useState('email'); // email | otp | success
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="login-panel">
      <div className="login-inner">
        <header className="login-header">
          <div className="step-pill">
            <span className={`step ${step === 'email' ? 'on' : 'done'}`}>1</span>
            <span className="step-line" />
            <span className={`step ${step === 'email' ? '' : 'on'}`}>2</span>
          </div>
          <h2 className="login-title">
            {step === 'email' && 'Sign in to Lakitu'}
            {step === 'otp' && 'Check your inbox'}
            {step === 'success' && "You're in"}
          </h2>
          <p className="login-sub">
            {step === 'email' &&
              "Use your work email. We'll send a single-use code — no password to forget."}
            {step === 'otp' && 'Codes expire in 10 minutes. Keep this tab open while you fetch it.'}
            {step === 'success' && 'Hang tight while we set up your session.'}
          </p>
        </header>

        <div className="step-stage">
          {step === 'email' && (
            <EmailStep
              email={email}
              setEmail={setEmail}
              error={error}
              onSubmit={() => {
                setError('');
                setStep('otp');
              }}
            />
          )}
          {step === 'otp' && (
            <OtpStep
              email={email}
              onBack={() => setStep('email')}
              onVerify={() => setStep('success')}
            />
          )}
          {step === 'success' && <SuccessStep email={email} />}
        </div>

        <footer className="login-foot">
          <span>© 2026 Lakitu Labs</span>
          <span className="foot-sep">·</span>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">
            Status <span className="status-dot" />
          </a>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="page">
      <BrandPanel />
      <LoginCard />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
