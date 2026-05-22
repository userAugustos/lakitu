import { Loader2 } from 'lucide-react';

import { Button } from '@repo/ui/shadcn/button';
import { useCopyToClipboard } from '@/modules/core/lib/use-copy-to-clipboard';

interface ClawkeyStepProps {
  registrationUrl: string;
  privateKey: string;
  onConfirm: () => void;
  onBypass: () => void;
  isBypassing: boolean;
  error: string | null;
}

export function ClawkeyStep({
  registrationUrl,
  privateKey,
  onConfirm,
  onBypass,
  isBypassing,
  error,
}: ClawkeyStepProps) {
  const privateKeyCopy = useCopyToClipboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-dash-ink text-[16px] font-semibold">ClawKey Registration</h3>
        <p className="text-dash-muted mt-1 text-[13px]">
          Complete the ClawKey registration to activate your agent.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-dash-muted text-[11.5px] font-semibold tracking-[0.04em] uppercase">
          Registration URL
        </span>
        <a
          href={registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="clawkey-registration-url"
          className="text-dash-sky-4 hover:text-dash-sky-3 text-[13px] break-all underline underline-offset-2"
        >
          {registrationUrl}
        </a>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-dash-muted text-[11.5px] font-semibold tracking-[0.04em] uppercase">
          Private Key
        </span>
        <div className="relative">
          <pre
            data-testid="private-key-display"
            className="border-dash-line bg-dash-paper text-dash-ink-2 overflow-x-auto rounded-lg border px-4 py-3 font-mono text-[12px] leading-relaxed"
          >
            {privateKey}
          </pre>
          <button
            type="button"
            onClick={() => privateKeyCopy.copyToClipboard(privateKey)}
            className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg absolute top-2 right-2 cursor-pointer rounded-md border bg-white px-2 py-1 text-[11px] font-medium"
          >
            {privateKeyCopy.message}
          </button>
        </div>
        <p className="text-dash-amber text-[12px] font-medium">
          Save this private key — it will not be shown again.
        </p>
      </div>

      {error && <p className="text-dash-red text-[13px]">{error}</p>}

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={onConfirm} data-testid="clawkey-continue">
          Continue
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onBypass}
          disabled={isBypassing}
          data-testid="clawkey-bypass"
        >
          {isBypassing ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Bypassing...</span>
            </>
          ) : (
            'Bypass ClawKey'
          )}
        </Button>
      </div>

      <p className="text-dash-muted text-center text-[11px]">
        At this moment, ClawKey may be experiencing an API error.
      </p>
    </div>
  );
}
