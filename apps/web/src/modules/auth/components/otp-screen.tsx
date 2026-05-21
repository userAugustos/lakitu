import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevError = useRef<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (error && error !== prevError.current) {
      setShake(true);
      setDigits(['', '', '', '', '', '']);
      const t = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(t);
    }
    prevError.current = error;
  }, [error]);

  const setRef = useCallback((el: HTMLInputElement | null, i: number) => {
    inputRefs.current[i] = el;
  }, []);

  const updateDigit = useCallback(
    (index: number, value: string) => {
      const next = [...digits];
      next[index] = value;
      setDigits(next);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      const code = next.join('');
      if (code.length === 6 && /^\d{6}$/.test(code) && !isSubmitting) {
        onSubmit(code);
      }
    },
    [digits, isSubmitting, onSubmit]
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>, index: number) => {
      const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '');
      updateDigit(index, raw.slice(-1));
    },
    [updateDigit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        updateDigit(index - 1, '');
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
      if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
    },
    [digits, updateDigit]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (!txt) return;
      e.preventDefault();
      const next = ['', '', '', '', '', ''];
      for (let k = 0; k < 6; k++) next[k] = txt[k] || '';
      setDigits(next);
      const focusIdx = Math.min(txt.length, 5);
      inputRefs.current[focusIdx]?.focus();

      if (txt.length === 6 && !isSubmitting) {
        onSubmit(txt);
      }
    },
    [isSubmitting, onSubmit]
  );

  const handleResend = useCallback(async () => {
    try {
      await sendChallenge(email);
      setSeconds(30);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('Code sent', { description: `A new code was sent to ${email}` });
    } catch (err) {
      toast.error('Failed to resend code', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    }
  }, [email]);

  const handleSubmitForm = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const code = digits.join('');
      if (code.length !== 6 || isSubmitting) return;
      onSubmit(code);
    },
    [digits, isSubmitting, onSubmit]
  );

  const code = digits.join('');
  const isComplete = code.length === 6 && /^\d{6}$/.test(code);
  const avatarLetter = email[0]?.toUpperCase() ?? 'A';

  return (
    <>
      <p className="lede">
        We sent a 6-digit code to{' '}
        <span className="email-pill">
          <span className="av">{avatarLetter}</span>
          <span>{email}</span>
          <button type="button" onClick={onBack} aria-label="Change email" data-testid="otp-back">
            Change
          </button>
        </span>
      </p>

      <form onSubmit={handleSubmitForm} noValidate>
        <div className="field">
          <label htmlFor="otp-0">Verification code</label>
          <div className={shake ? 'otp-row shake' : 'otp-row'} data-testid="otp-input">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => setRef(el, i)}
                className={digit ? 'otp-cell filled' : 'otp-cell'}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                autoComplete={i === 0 ? 'one-time-code' : undefined}
                aria-label={`Digit ${i + 1}`}
                value={digit}
                onInput={(e) => handleInput(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                disabled={isSubmitting}
              />
            ))}
          </div>
        </div>

        {error && <div className="field-error">{error}</div>}

        <button
          className="btn"
          type="submit"
          disabled={!isComplete || isSubmitting}
          data-testid="otp-submit"
        >
          {isSubmitting ? (
            <>
              <span className="spinner" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify and sign in</span>
              <svg
                className="arr"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>

        <p className="resend">
          Didn't get it?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={seconds > 0}
            data-testid="otp-resend"
          >
            Resend code
          </button>
          {seconds > 0 && <span>&nbsp;(in {seconds}s)</span>}
        </p>
      </form>

      <p className="meta" style={{ marginTop: 32 }}>
        Code expires in 10 minutes. <a href="#">Need help?</a>
      </p>

      {webEnv.app.isDevelopment && (
        <p className="meta" style={{ marginTop: 8, opacity: 0.5 }}>
          Dev hint: <code style={{ fontFamily: 'var(--font-mono)' }}>111111</code>
        </p>
      )}
    </>
  );
}
