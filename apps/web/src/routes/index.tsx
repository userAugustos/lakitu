import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Button } from '@repo/ui/shadcn/button';
import { apiCall, lakituApi } from '@/api';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  useEffect(() => {
    apiCall<{ status: string }>(() => lakituApi.healthz.get())
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div data-testid="home" className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold">lakitu</h1>
        <p data-testid="api-status" className="text-muted-foreground text-sm">
          API: {status}
        </p>
        <Button data-testid="ping-btn" variant="outline">
          Ping API
        </Button>
      </div>
    </main>
  );
}
