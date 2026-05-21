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
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          className={errors.email ? 'input error' : 'input'}
          type="email"
          autoFocus
          autoComplete="email"
          placeholder="you@company.com"
          data-testid="email-input"
          {...register('email')}
        />
        {errors.email && <div className="field-error">{errors.email.message}</div>}
        {error && <div className="field-error">{error}</div>}
      </div>

      <button type="submit" className="btn" disabled={isSubmitting} data-testid="email-submit">
        {isSubmitting ? (
          <>
            <span className="spinner" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send code</span>
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

      <p className="help">
        By continuing you agree to Lakitu's <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
        .
      </p>

      <p className="meta">
        Trouble signing in? <a href="#">Contact your admin</a>
      </p>
    </form>
  );
}
