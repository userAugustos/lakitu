import { XCircle } from 'lucide-react';

import { Button } from '@repo/ui/shadcn/button';

interface ErrorScreenProps {
  message: string;
  onRetry: (() => void) | null;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center pt-6 text-center" data-testid="error-screen">
      <div className="bg-destructive/10 inline-flex size-16 items-center justify-center rounded-full">
        <XCircle className="text-destructive size-8" />
      </div>

      <h3 className="font-display mt-4 mb-2 text-lg font-bold">Something went wrong</h3>
      <p className="text-muted-foreground max-w-xs text-sm">{message}</p>

      {onRetry ? (
        <div className="mt-4 w-full max-w-xs">
          <Button type="button" onClick={onRetry} data-testid="retry-button">
            Try again
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-[13px]">
          Please refresh the page and try again.
        </p>
      )}
    </div>
  );
}
