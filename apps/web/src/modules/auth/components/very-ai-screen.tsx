export function VeryAiScreen() {
  return (
    <div
      className="auth-form"
      style={{ alignItems: 'center', textAlign: 'center', paddingTop: 24 }}
    >
      <div className="spinner" style={{ width: 24, height: 24 }} />
      <h3 style={{ margin: '16px 0 8px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        Redirecting to VeryAI...
      </h3>
      <p style={{ color: 'var(--auth-muted)', fontSize: 14, maxWidth: 320 }}>
        You&apos;ll be taken to VeryAI to verify your identity. Once complete, you&apos;ll return
        here automatically.
      </p>
    </div>
  );
}
