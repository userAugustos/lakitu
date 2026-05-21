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
          Sign in to your workspace. We'll send a <b className="font-semibold text-foreground">6-digit code</b> to your work email — no
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
    <section className="relative flex items-center justify-center bg-[#fbfcfd] p-14 max-[980px]:px-6 max-[980px]:pt-9 max-[980px]:pb-18">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[length:48px_48px] opacity-35 [mask-image:radial-gradient(80%_60%_at_50%_40%,black_0%,transparent_80%)]" />

      <div className="relative w-full max-w-[420px]">
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-300" key={screen}>
          <h1 className="m-0 mb-2 font-display text-[32px] font-bold -tracking-wide text-foreground">
            {getTitle(screen)}
          </h1>
          {subtitle && (
            <p className="m-0 mb-7 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
          {children}
        </div>
      </div>

      <div className="absolute bottom-6 right-0 left-0 flex justify-between px-14 text-xs text-muted-foreground max-[980px]:px-6">
        <span>&copy; 2026 Lakitu Labs, Inc.</span>
        <span>
          <a href="mailto:felipe_augustos84@outlook.com.br" className="text-muted-foreground no-underline hover:text-foreground/70">
            felipe_augustos84@outlook.com.br
          </a>
        </span>
      </div>
    </section>
  );
}
