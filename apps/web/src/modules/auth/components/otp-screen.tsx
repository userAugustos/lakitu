import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@repo/ui/shadcn/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/shadcn/input-otp';
import { Label } from '@repo/ui/shadcn/label';
import { apiCall, lakituPublicApi } from '@/api';
import { webEnv } from '@/modules/core/lib/env';

import { otpSchema } from '../auth-setup.schemas';
import { FieldError } from './field-error';
import type { OtpFormValues } from '../auth-setup.schemas';

interface OtpScreenProps {
  email: string;
  onSubmit: (code: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function OtpScreen({ email, onSubmit, onBack, isSubmitting, error }: OtpScreenProps) {
  const [seconds, setSeconds] = useState(30);
  const [dirty, setDirty] = useState(false);

  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  const code = form.watch('code');
  const isComplete = code.length === 6;

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (error) {
      setDirty(false);
      form.setValue('code', '');
    }
  }, [error, form]);

  const handleComplete = (value: string) => {
    form.setValue('code', value);
    if (!isSubmitting) onSubmit(value);
  };

  const handleResend = useCallback(async () => {
    try {
      await apiCall(() => lakituPublicApi.auth.challenge.post({ email }));
      setSeconds(30);
      form.setValue('code', '');
      toast.success('Code sent', { description: `A new code was sent to ${email}` });
    } catch (err) {
      toast.error('Failed to resend code', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    }
  }, [email, form]);

  const avatarLetter = email[0]?.toUpperCase() ?? 'A';

  return (
    <>
      <p className="text-muted-foreground m-0 mb-7 text-sm leading-relaxed">
        We sent a 6-digit code to{' '}
        <span className="border-border bg-secondary text-foreground inline-flex items-center gap-2 rounded-full border px-2.5 py-1 pl-1.5 text-[13px] font-medium">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-[#7fc2ff] to-[#1e73cc] text-[11px] font-bold text-white">
            {avatarLetter}
          </span>
          <span>{email}</span>
          <button
            type="button"
            onClick={onBack}
            className="font-inherit text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0 px-1 text-xs"
            aria-label="Change email"
            data-testid="otp-back"
          >
            Change
          </button>
        </span>
      </p>

      <form
        onSubmit={form.handleSubmit(() => onSubmit(code))}
        noValidate
        className="flex flex-col gap-2.5"
      >
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold tracking-wide">Verification code</Label>
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => {
              form.setValue('code', value);
              setDirty(true);
            }}
            onComplete={handleComplete}
            disabled={isSubmitting}
            data-testid="otp-input"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FieldError message={dirty ? null : error} />
        </div>

        <Button type="submit" disabled={!isComplete || isSubmitting} data-testid="otp-submit">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify and sign in</span>
              <ArrowRight />
            </>
          )}
        </Button>

        <p className="text-muted-foreground text-[13px]">
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={seconds > 0}
            className="border-border font-inherit text-foreground/70 disabled:text-muted-foreground/50 cursor-pointer border-0 border-b bg-transparent p-0 text-[13px] font-medium disabled:cursor-not-allowed disabled:border-transparent"
            data-testid="otp-resend"
          >
            Resend code
          </button>
          {seconds > 0 && <span>&nbsp;(in {seconds}s)</span>}
        </p>
      </form>

      <p className="text-muted-foreground pt-5 text-center text-xs">
        Code expires in 10 minutes.{' '}
        <a
          href="#"
          className="text-foreground/70 hover:border-foreground/50 hover:text-foreground border-b border-transparent"
        >
          Need help?
        </a>
      </p>

      {webEnv.app.isDevelopment && (
        <p className="text-muted-foreground/50 pt-1.5 text-center text-xs">
          Dev hint: <code className="font-mono">111111</code>
        </p>
      )}
    </>
  );
}
