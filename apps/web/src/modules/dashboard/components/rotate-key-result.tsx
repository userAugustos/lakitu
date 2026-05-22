import { useState } from 'react';
import { toast } from 'sonner';

import type { RotateKeyResponse } from '@lakitu/api/agents';

import { Button } from '@repo/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/shadcn/dialog';
import { cn } from '@repo/ui/utils';
import { apiCall, lakituAuthApi } from '@/api';
import { queryClient } from '@/main';

interface RotateKeyDialogProps {
  agentId: string;
  agentName: string;
  children: React.ReactNode;
}

type Step = 'confirm' | 'executing' | 'result' | 'error';

export function RotateKeyDialog({ agentId, agentName, children }: RotateKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('confirm');
  const [result, setResult] = useState<RotateKeyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleConfirm = async () => {
    setStep('executing');
    try {
      const data = await apiCall<RotateKeyResponse>(() =>
        lakituAuthApi.agents[agentId]!['rotate-key'].post()
      );
      setResult(data);
      setStep('result');
      void queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (e) {
      setError((e as Error).message ?? 'Failed to rotate key');
      setStep('error');
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (step === 'executing') return;
    if (step === 'result' && !nextOpen) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setStep('confirm');
      setResult(null);
      setError(null);
    }
  };

  const handleDone = () => {
    toast.success('Key rotated successfully');
    setOpen(false);
    setStep('confirm');
    setResult(null);
  };

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[540px] overflow-hidden" hideClose={step === 'result'}>
        <div
          className={cn(step !== 'confirm' && step !== 'executing' && step !== 'error' && 'hidden')}
        >
          <DialogHeader>
            <DialogTitle>Rotate Key</DialogTitle>
            <DialogDescription>
              A new keypair will be generated for {agentName}. The current key will be invalidated
              immediately.
            </DialogDescription>
          </DialogHeader>
          <p className={cn('text-dash-red mt-2 text-[12px]', !error && 'hidden')}>{error}</p>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="destructive"
              disabled={step === 'executing'}
              onClick={handleConfirm}
              className="w-full"
            >
              {step === 'executing' ? 'Rotating...' : 'Rotate Key'}
            </Button>
          </DialogFooter>
        </div>

        <div className={cn(step !== 'result' && 'hidden')}>
          <DialogHeader>
            <DialogTitle>Key Rotated Successfully</DialogTitle>
            <DialogDescription className="text-dash-amber font-medium">
              Save these credentials — they will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-dash-muted text-[11.5px] font-semibold tracking-[0.04em] uppercase">
                Registration URL
              </span>
              <div className="relative">
                <a
                  href={result?.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="rotate-registration-url"
                  className="text-dash-sky-4 hover:text-dash-sky-3 text-[13px] break-all underline underline-offset-2"
                >
                  {result?.registration_url}
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result?.registration_url ?? '', setCopiedUrl)}
                  className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg ml-2 inline-flex cursor-pointer rounded-md border bg-white px-2 py-0.5 text-[11px] font-medium"
                >
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-dash-muted text-[11.5px] font-semibold tracking-[0.04em] uppercase">
                Private Key
              </span>
              <div className="relative">
                <pre
                  data-testid="rotate-private-key"
                  className="border-dash-line bg-dash-paper text-dash-ink-2 overflow-x-auto rounded-lg border px-4 py-3 font-mono text-[12px] leading-relaxed"
                >
                  {result?.ed25519_private_key}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result?.ed25519_private_key ?? '', setCopiedKey)}
                  className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg absolute top-2 right-2 cursor-pointer rounded-md border bg-white px-2 py-1 text-[11px] font-medium"
                >
                  {copiedKey ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              onClick={handleDone}
              data-testid="rotate-key-dismiss"
              className="w-full"
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
