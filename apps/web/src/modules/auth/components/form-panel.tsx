import type { ReactNode } from 'react';

import type { AuthScreen } from '../auth-setup.types';

interface FormPanelProps {
  screen: AuthScreen;
  children: ReactNode;
}

function getTitle(screen: AuthScreen): string {
  switch (screen) {
    case 'loading':
      return 'Setting up...';
    case 'email':
      return 'Welcome back';
    case 'otp':
      return 'Check your email';
    case 'company':
      return 'Set up your company';
    case 'very-ai':
      return 'Verify with VeryAI';
    case 'success':
      return "You're in";
    case 'error':
      return 'Something went wrong';
  }
}

function getSubtitle(screen: AuthScreen): ReactNode {
  switch (screen) {
    case 'loading':
      return 'Checking your session...';
    case 'email':
      return (
        <>
          Sign in to your workspace. We'll send a <b>6-digit code</b> to your work email — no
          password required.
        </>
      );
    case 'otp':
      return null;
    case 'company':
      return 'Create a new company or join an existing one.';
    case 'very-ai':
      return 'We need to verify your identity to continue.';
    case 'success':
      return 'Hang tight while we set up your session.';
    case 'error':
      return 'We hit a snag. You can retry or start over.';
  }
}

export function FormPanel({ screen, children }: FormPanelProps) {
  const subtitle = getSubtitle(screen);

  return (
    <section className="panel">
      <div className="card">
        <div className="step-content" key={screen}>
          <h1>{getTitle(screen)}</h1>
          {subtitle && <p className="lede">{subtitle}</p>}
          {children}
        </div>
      </div>

      <div className="panel-foot">
        <span>&copy; 2026 Lakitu Labs, Inc.</span>
        <span>
          <a href="mailto:support@lakitu.dev">support@lakitu.dev</a>
        </span>
      </div>
    </section>
  );
}
