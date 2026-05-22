import { useState } from 'react';

import type { RotateKeyResponse } from '@lakitu/api/agents';

import { Button } from '@repo/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/shadcn/dialog';

interface RotateKeyResultProps {
  result: RotateKeyResponse;
  onDismiss: () => void;
}

export function RotateKeyResult({ result, onDismiss }: RotateKeyResultProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

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
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        data-testid="rotate-key-result-overlay"
        className="max-w-[540px] overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        hideClose
      >
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
                href={result.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="rotate-registration-url"
                className="text-dash-sky-4 hover:text-dash-sky-3 text-[13px] break-all underline underline-offset-2"
              >
                {result.registration_url}
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(result.registration_url, setCopiedUrl)}
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
                {result.ed25519_private_key}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard(result.ed25519_private_key, setCopiedKey)}
                className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg absolute top-2 right-2 cursor-pointer rounded-md border bg-white px-2 py-1 text-[11px] font-medium"
              >
                {copiedKey ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={onDismiss}
            data-testid="rotate-key-dismiss"
            className="w-full"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
