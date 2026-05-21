interface SuccessScreenProps {
  email: string;
}

export function SuccessScreen({ email }: SuccessScreenProps) {
  return (
    <div className="success-screen" data-testid="success-screen">
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
      <p>
        Welcome back. Routing <strong>{email}</strong> to the control tower...
      </p>
      <div className="loader-bar">
        <div className="loader-fill" />
      </div>
    </div>
  );
}
