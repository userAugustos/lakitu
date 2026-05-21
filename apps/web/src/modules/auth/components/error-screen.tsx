import { Button } from '@repo/ui/shadcn/button';

interface ErrorScreenProps {
  message: string;
  onRetry: (() => void) | null;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center pt-6 text-center" data-testid="error-screen">
      <div className="inline-flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-destructive" />
          <path d="M11 11l10 10M21 11l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-destructive" />
        </svg>
      </div>

      <h3 className="mt-4 mb-2 font-display text-lg font-bold">Something went wrong</h3>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>

      {onRetry ? (
        <div className="mt-4 w-full max-w-xs">
          <Button type="button" onClick={onRetry} data-testid="retry-button">
            Try again
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-muted-foreground">
          Please refresh the page and try again.
        </p>
      )}
    </div>
  );
}
