import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@repo/ui/shadcn/button';
import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';

import { emailSchema } from '../auth-setup.schemas';
import { FieldError } from './field-error';
import type { EmailFormValues } from '../auth-setup.schemas';

interface EmailScreenProps {
  onSubmit: (email: string) => void;
  isSubmitting: boolean;
  error: string | null;
}

export function EmailScreen({ onSubmit, isSubmitting, error }: EmailScreenProps) {
  const [dirty, setDirty] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (error) setDirty(false);
  }, [error]);

  const onValid = (data: EmailFormValues) => {
    setDirty(false);
    onSubmit(data.email);
  };

  const { onChange: rhfOnChange, ...emailRegister } = register('email');
  const visibleError = dirty ? null : (errors.email?.message ?? error);

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-xs font-semibold tracking-wide">
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
            visibleError ? 'border-destructive shadow-[0_0_0_4px_rgba(230,57,70,0.12)]' : ''
          }
          onChange={(e) => {
            void rhfOnChange(e);
            setDirty(true);
            clearErrors();
          }}
          {...emailRegister}
        />
        <FieldError message={visibleError} />
      </div>

      <Button type="submit" disabled={isSubmitting} data-testid="email-submit">
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send code</span>
            <ArrowRight />
          </>
        )}
      </Button>

      <p className="text-muted-foreground text-xs leading-relaxed">
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

      <p className="text-muted-foreground pt-4 text-center text-xs">
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
