import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useMachine } from '@xstate/react';

import { authSetupMachine } from '@/modules/auth/auth-setup.machine';
import { AuthLayout } from '@/modules/auth/components/auth-layout';
import { CompanyScreen } from '@/modules/auth/components/company-screen';
import { EmailScreen } from '@/modules/auth/components/email-screen';
import { ErrorScreen } from '@/modules/auth/components/error-screen';
import { OtpScreen } from '@/modules/auth/components/otp-screen';
import { SuccessScreen } from '@/modules/auth/components/success-screen';
import { VeryAiScreen } from '@/modules/auth/components/very-ai-screen';

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

  const content = (() => {
    switch (screen) {
      case 'loading':
        return (
          <div className="flex items-center justify-center py-12" data-testid="auth-loading">
            <Loader2 className="text-muted-foreground animate-spin" />
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
            onRetry={retryCount < 3 ? () => send({ type: 'RETRY' }) : null}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <>
      <AuthLayout screen={screen}>{content}</AuthLayout>
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
