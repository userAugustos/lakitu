import {
  ClawkeyExpiringIcon,
  ClawkeyRevokedIcon,
  ClawkeyRotatingIcon,
  ClawkeyValidIcon,
} from '../lib/dashboard-icons';

const STATE_STYLES: Record<string, string> = {
  valid: 'bg-dash-gray-bg border-dash-line text-dash-ink-2',
  expiring: 'bg-dash-amber-bg border-[#F2DDA6] text-dash-amber',
  rotating: 'bg-[#E3F0FF] border-[#BFDDFC] text-dash-sky-4',
  revoked: 'bg-dash-red-bg border-[#F3C9C2] text-dash-red line-through',
};

const STATE_ICON_STYLES: Record<string, string> = {
  valid: 'text-dash-green',
  expiring: 'text-dash-amber',
  rotating: 'text-dash-sky-4',
  revoked: 'text-dash-red',
};

function ClawkeyIcon({ state, className }: { state: string; className?: string }) {
  switch (state) {
    case 'valid':
      return <ClawkeyValidIcon className={className} />;
    case 'expiring':
      return <ClawkeyExpiringIcon className={className} />;
    case 'rotating':
      return <ClawkeyRotatingIcon className={className} />;
    case 'revoked':
      return <ClawkeyRevokedIcon className={className} />;
    default:
      return null;
  }
}

interface ClawkeyPillProps {
  state: string;
  label: string;
  note?: string;
}

export function ClawkeyPill({ state, label, note }: ClawkeyPillProps) {
  const pillStyle = STATE_STYLES[state] ?? STATE_STYLES.valid;
  const iconStyle = STATE_ICON_STYLES[state] ?? STATE_ICON_STYLES.valid;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-2 py-1 font-mono text-[12px] ${pillStyle}`}
      title={note}
    >
      <span className={`inline-flex h-3.5 w-3.5 items-center justify-center ${iconStyle}`}>
        <ClawkeyIcon state={state} className="h-3.5 w-3.5" />
      </span>
      <span>{label}</span>
    </span>
  );
}
