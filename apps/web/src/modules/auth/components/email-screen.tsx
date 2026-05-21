import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@repo/ui/shadcn/button';
import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';

import { emailSchema } from '../auth-setup.schemas';
import type { EmailFormValues } from '../auth-setup.schemas';

interface EmailScreenProps {
  onSubmit: (email: string) => void;
  isSubmitting: boolean;
  error: string | null;
}

export function EmailScreen({ onSubmit, isSubmitting, error }: EmailScreenProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onSubmit',
  });

  const onValid = (data: EmailFormValues) => {
    onSubmit(data.email);
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <div className="mb-3.5">
        <Label htmlFor="email" className="mb-2 block text-xs font-semibold tracking-wide">
          Work email
        </Label>
        <Input
          id="email"
          type="email"
          autoFocus
          autoComplete="email"
          placeholder="you@company.com"
          data-testid="email-input"
          className={
            errors.email || error
              ? 'border-destructive shadow-[0_0_0_4px_rgba(230,57,70,0.12)]'
              : ''
          }
          {...register('email')}
        />
        {errors.email && (
          <p className="text-destructive mt-1 text-[13px]">{errors.email.message}</p>
        )}
        {error && <p className="text-destructive mt-1 text-[13px]">{error}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} data-testid="email-submit">
        {isSubmitting ? (
          <>
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send code</span>
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

      <p className="text-muted-foreground mt-2.5 text-xs leading-relaxed">
        By continuing you agree to Lakitu&apos;s{' '}
        <a href="#" className="border-border text-foreground/70 hover:text-foreground border-b">
          Terms
        </a>{' '}
        and{' '}
        <a href="#" className="border-border text-foreground/70 hover:text-foreground border-b">
          Privacy Policy
        </a>
        .
      </p>

      <p className="text-muted-foreground mt-7 text-center text-xs">
        Trouble signing in?{' '}
        <a
          href="#"
          className="text-foreground/70 hover:border-foreground/50 hover:text-foreground border-b border-transparent"
        >
          Contact your admin
        </a>
      </p>
    </form>
  );
}
