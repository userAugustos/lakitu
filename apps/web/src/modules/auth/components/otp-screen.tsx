import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/shadcn/input-otp';
import { webEnv } from '@/modules/core/lib/env';

import { sendChallenge } from '../auth-setup.api';

interface OtpScreenProps {
  email: string;
  onSubmit: (code: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function OtpScreen({ email, onSubmit, onBack, isSubmitting, error }: OtpScreenProps) {
  const [seconds, setSeconds] = useState(30);
  const [shake, setShake] = useState(false);
  const [value, setValue] = useState('');
  const prevError = useRef<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (error && error !== prevError.current) {
      setShake(true);
      setValue('');
      const t = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(t);
    }
    prevError.current = error;
  }, [error]);

  const handleComplete = useCallback(
    (code: string) => {
      if (isSubmitting) return;
      onSubmit(code);
    },
    [isSubmitting, onSubmit]
  );

  const handleResend = useCallback(async () => {
    try {
      await sendChallenge(email);
      setSeconds(30);
      toast.success('Code sent', { description: `A new code was sent to ${email}` });
    } catch (err) {
      toast.error('Failed to resend code', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    }
  }, [email]);

  return (
    <div className="auth-form">
      <button className="back-link" onClick={onBack} type="button" data-testid="otp-back">
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

      <div className={`otp-row ${shake ? 'shake' : ''}`} data-testid="otp-input">
        <InputOTP
          maxLength={6}
          pattern="^\d+$"
          value={value}
          onChange={setValue}
          onComplete={handleComplete}
          disabled={isSubmitting}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <div className="field-error">{error}</div>}

      <div className="otp-footer">
        {seconds > 0 ? (
          <span style={{ color: 'var(--auth-muted)' }}>
            Resend code in{' '}
            <strong style={{ color: 'var(--ink)' }}>0:{seconds.toString().padStart(2, '0')}</strong>
          </span>
        ) : (
          <button
            type="button"
            className="link-btn"
            onClick={handleResend}
            data-testid="otp-resend"
          >
            Resend code
          </button>
        )}
        {webEnv.app.isDevelopment && (
          <>
            <span style={{ color: 'var(--auth-muted)', opacity: 0.5 }}>·</span>
            <span style={{ color: 'var(--auth-muted)' }}>
              Hint: <code>111111</code>
            </span>
          </>
        )}
      </div>

      {isSubmitting && (
        <div className="verify-state">
          <div className="spinner" />
          Verifying code...
        </div>
      )}
    </div>
  );
}
