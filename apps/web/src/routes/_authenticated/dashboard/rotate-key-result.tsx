import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';

import type { RotateKeyResponse } from '@lakitu/api/agents';

import { Button } from '@repo/ui/shadcn/button';
import { useCopyToClipboard } from '@/modules/core/lib/use-copy-to-clipboard';

export const Route = createFileRoute('/_authenticated/dashboard/rotate-key-result')({
  component: RotateKeyResultPage,
});

function RotateKeyResultPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const result = router.state.location.state as unknown as RotateKeyResponse | undefined;
  const registrationUrlCopy = useCopyToClipboard();
  const privateKeyCopy = useCopyToClipboard();

  if (!result?.ed25519_private_key) {
    void navigate({ to: '/dashboard' });
    return null;
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="border-dash-line overflow-hidden rounded-2xl border bg-white p-8">
        <h2 className="text-dash-ink text-[18px] font-semibold">Key Rotated Successfully</h2>
        <p className="text-dash-amber mt-1 text-[13px] font-medium">
          Save these credentials — they will not be shown again.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-dash-muted text-[11.5px] font-semibold tracking-[0.04em] uppercase">
              Registration URL
            </span>
            <div className="flex items-start gap-2">
              <a
                href={result.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="rotate-registration-url"
                className="text-dash-sky-4 hover:text-dash-sky-3 min-w-0 flex-1 text-[13px] break-all underline underline-offset-2"
              >
                {result.registration_url}
              </a>
              <button
                type="button"
                onClick={() => registrationUrlCopy.copyToClipboard(result.registration_url)}
                className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg shrink-0 cursor-pointer rounded-md border bg-white px-2 py-0.5 text-[11px] font-medium"
              >
                {registrationUrlCopy.message}
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
                onClick={() => privateKeyCopy.copyToClipboard(result.ed25519_private_key)}
                className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg absolute top-2 right-2 cursor-pointer rounded-md border bg-white px-2 py-1 text-[11px] font-medium"
              >
                {privateKeyCopy.message}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            onClick={() => navigate({ to: '/dashboard' })}
            data-testid="rotate-key-dismiss"
            className="w-full"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
