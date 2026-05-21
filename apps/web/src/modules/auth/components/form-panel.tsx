import type { ReactNode } from 'react';

import { StepIndicator } from './step-indicator';
import type { AuthScreen } from '../auth-setup.types';

interface FormPanelProps {
  screen: AuthScreen;
  children: ReactNode;
}

function getStepInfo(screen: AuthScreen): { current: number; total: number } | null {
  switch (screen) {
    case 'email':
      return { current: 1, total: 2 };
    case 'otp':
      return { current: 2, total: 2 };
    case 'company':
      return { current: 1, total: 2 };
    case 'very-ai':
      return { current: 2, total: 2 };
    default:
      return null;
  }
}

function getTitle(screen: AuthScreen): string {
  switch (screen) {
    case 'loading':
      return 'Setting up...';
    case 'email':
      return 'Sign in to Lakitu';
    case 'otp':
      return 'Check your inbox';
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

function getSubtitle(screen: AuthScreen): string {
  switch (screen) {
    case 'loading':
      return 'Checking your session...';
    case 'email':
      return "Use your work email. We'll send a single-use code — no password to forget.";
    case 'otp':
      return 'Codes expire in 10 minutes. Keep this tab open while you fetch it.';
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
  const stepInfo = getStepInfo(screen);

  return (
    <div className="login-panel">
      <div className="login-inner">
        <header className="login-header">
          {stepInfo && <StepIndicator currentStep={stepInfo.current} totalSteps={stepInfo.total} />}
          <h2 className="login-title">{getTitle(screen)}</h2>
          <p className="login-sub">{getSubtitle(screen)}</p>
        </header>

        <div className="step-stage">{children}</div>

        <footer className="login-foot">
          <span>&copy; 2026 Lakitu Labs</span>
          <span className="foot-sep">&middot;</span>
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
