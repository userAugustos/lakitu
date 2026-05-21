interface ErrorScreenProps {
  message: string;
  onRetry: (() => void) | null;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: 24,
        gap: 0,
      }}
      data-testid="error-screen"
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#fff4f3',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#e63946" strokeWidth="1.5" />
          <path
            d="M11 11l10 10M21 11l-10 10"
            stroke="#e63946"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 style={{ margin: '16px 0 8px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        Something went wrong
      </h3>
      <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 320 }}>{message}</p>

      {onRetry ? (
        <button
          type="button"
          className="btn"
          style={{ marginTop: 16 }}
          onClick={onRetry}
          data-testid="retry-button"
        >
          Try again
        </button>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Please refresh the page and try again.
        </p>
      )}
    </div>
  );
}
