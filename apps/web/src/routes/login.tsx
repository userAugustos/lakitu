import { createFileRoute } from '@tanstack/react-router';
import { useMachine } from '@xstate/react';

import { authSetupMachine } from '@/modules/auth/auth-setup.machine';
import { AuthLayout } from '@/modules/auth/components/auth-layout';
import { CompanyScreen } from '@/modules/auth/components/company-screen';
import { EmailScreen } from '@/modules/auth/components/email-screen';
import { ErrorScreen } from '@/modules/auth/components/error-screen';
import { OtpScreen } from '@/modules/auth/components/otp-screen';
import { SuccessScreen } from '@/modules/auth/components/success-screen';
import { VeryAiScreen } from '@/modules/auth/components/very-ai-screen';
import type { AuthScreen, AuthSetupEvent } from '@/modules/auth/auth-setup.types';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [state, send] = useMachine(authSetupMachine);
  const { screen, email, error, retryCount } = state.context;
  const isSubmitting =
    state.matches({ email: 'submitting' }) ||
    state.matches({ otp: 'submitting' }) ||
    state.matches({ company: 'creating' }) ||
    state.matches({ company: 'joining' });

  return (
    <>
      <AuthLayout screen={screen}>
        <ScreenSwitch
          screen={screen}
          email={email}
          error={error}
          isSubmitting={isSubmitting}
          canRetry={retryCount < 3}
          send={send}
        />
      </AuthLayout>
      {screen !== 'email' && screen !== 'loading' && (
        <button
          className="text-muted-foreground hover:text-foreground absolute top-6 right-6 text-sm"
          onClick={() => send({ type: 'LOGOUT' })}
          data-testid="logout-button"
        >
          Sign out
        </button>
      )}
    </>
  );
}

interface ScreenSwitchProps {
  screen: AuthScreen;
  email: string;
  error: { message: string; code?: string } | null;
  isSubmitting: boolean;
  canRetry: boolean;
  send: (event: AuthSetupEvent) => void;
}

function ScreenSwitch({ screen, email, error, isSubmitting, canRetry, send }: ScreenSwitchProps) {
  switch (screen) {
    case 'loading':
      return (
        <div className="flex items-center justify-center py-12" data-testid="auth-loading">
          <span className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      );
    case 'email':
      return (
        <EmailScreen
          onSubmit={(e) => send({ type: 'SUBMIT_EMAIL', email: e })}
          isSubmitting={isSubmitting}
          error={error?.message ?? null}
        />
      );
    case 'otp':
      return (
        <OtpScreen
          email={email}
          onSubmit={(code) => send({ type: 'SUBMIT_OTP', code })}
          onBack={() => send({ type: 'BACK_TO_EMAIL' })}
          isSubmitting={isSubmitting}
          error={error?.message ?? null}
        />
      );
    case 'company':
      return (
        <CompanyScreen
          onCreateCompany={(name) => send({ type: 'CREATE_COMPANY', name })}
          onJoinCompany={(companyId) => send({ type: 'JOIN_COMPANY', companyId })}
          isSubmitting={isSubmitting}
          error={error?.message ?? null}
        />
      );
    case 'very-ai':
      return <VeryAiScreen />;
    case 'success':
      return <SuccessScreen email={email} />;
    case 'error':
      return (
        <ErrorScreen
          message={error?.message ?? 'Something went wrong'}
          onRetry={canRetry ? () => send({ type: 'RETRY' }) : null}
        />
      );
    default:
      return null;
  }
}
