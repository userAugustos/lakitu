import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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
    formState: { errors, isValid },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
  });

  const onValid = (data: EmailFormValues) => {
    onSubmit(data.email);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onValid)}>
      <label className="field-label" htmlFor="email">
        Work email
      </label>
      <input
        id="email"
        className="text-input"
        type="email"
        autoFocus
        autoComplete="email"
        placeholder="you@company.com"
        data-testid="email-input"
        {...register('email')}
      />
      {errors.email && <div className="field-error">{errors.email.message}</div>}
      {error && <div className="field-error">{error}</div>}

      <button
        type="submit"
        className="primary-btn"
        disabled={!isValid || isSubmitting}
        data-testid="email-submit"
      >
        {isSubmitting ? (
          <>
            <span className="spinner" />
            Sending...
          </>
        ) : (
          <>
            <span>Send one-time code</span>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3 8h9.5M9 4.5l4 3.5-4 3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
