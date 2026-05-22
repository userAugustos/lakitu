const STROKE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function ClawkeyValidIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS}>
      <path d="M21 12a9 9 0 1 1-9-9" />
      <path d="m9 12 2 2 4-4" />
      <path d="M21 5v4h-4" />
    </svg>
  );
}

export function ClawkeyExpiringIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function ClawkeyRotatingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS}>
      <path d="M21 12a9 9 0 0 1-15.5 6.3" />
      <path d="M3 12a9 9 0 0 1 15.5-6.3" />
      <path d="M3 5v4h4" />
      <path d="M21 19v-4h-4" />
    </svg>
  );
}

export function ClawkeyRevokedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </svg>
  );
}

export function RevokeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS} strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </svg>
  );
}

export function RotateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS} strokeWidth={1.75}>
      <path d="M21 12a9 9 0 0 1-15.5 6.3" />
      <path d="M3 12a9 9 0 0 1 15.5-6.3" />
      <path d="M3 5v4h4" />
      <path d="M21 19v-4h-4" />
    </svg>
  );
}

export function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS} strokeWidth={1.75}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function InboxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );
}

export function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE_PROPS}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
