import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@repo/ui/shadcn/button';
import { Label } from '@repo/ui/shadcn/label';

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
      <p className="m-0 mb-7 text-sm leading-relaxed text-muted-foreground">
        We sent a 6-digit code to{' '}
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-2.5 py-1 pl-1.5 text-[13px] font-medium text-foreground">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-[#7fc2ff] to-[#1e73cc] text-[11px] font-bold text-white">
            {avatarLetter}
          </span>
          <span>{email}</span>
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer border-0 bg-transparent p-0 px-1 font-inherit text-xs text-muted-foreground hover:text-foreground"
            aria-label="Change email"
            data-testid="otp-back"
          >
            Change
          </button>
        </span>
      </p>

      <form onSubmit={handleSubmitForm} noValidate>
        <div className="mb-3.5">
          <Label htmlFor="otp-0" className="mb-2 block text-xs font-semibold tracking-wide">
            Verification code
          </Label>
          <div
            className={`grid grid-cols-6 gap-2.5 ${shake ? 'animate-shake' : ''}`}
            data-testid="otp-input"
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => setRef(el, i)}
                className={`h-14 w-full rounded-xl border bg-white text-center font-mono text-lg font-semibold text-foreground outline-none ${
                  digit ? 'border-foreground bg-[#fbfcfd]' : 'border-input'
                }`}
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

        {error && <p className="mt-1 text-[13px] text-destructive">{error}</p>}

        <Button type="submit" disabled={!isComplete || isSubmitting} data-testid="otp-submit">
          {isSubmitting ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify and sign in</span>
              <svg
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
        </Button>

        <p className="mt-2.5 text-[13px] text-muted-foreground">
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={seconds > 0}
            className="cursor-pointer border-0 border-b border-border bg-transparent p-0 font-inherit text-[13px] font-medium text-foreground/70 disabled:cursor-not-allowed disabled:text-muted-foreground/50 disabled:border-transparent"
            data-testid="otp-resend"
          >
            Resend code
          </button>
          {seconds > 0 && <span>&nbsp;(in {seconds}s)</span>}
        </p>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Code expires in 10 minutes.{' '}
        <a href="#" className="border-b border-transparent text-foreground/70 hover:border-foreground/50 hover:text-foreground">
          Need help?
        </a>
      </p>

      {webEnv.app.isDevelopment && (
        <p className="mt-2 text-center text-xs text-muted-foreground/50">
          Dev hint: <code className="font-mono">111111</code>
        </p>
      )}
    </>
  );
}
