interface PermissionsBadgeProps {
  count: number;
}

export function PermissionsBadge({ count }: PermissionsBadgeProps) {
  if (count === 0) {
    return <span className="text-dash-muted text-[13px]">None</span>;
  }

  return (
    <span className="text-dash-ink-2 text-[13px]">
      {count} permission{count !== 1 ? 's' : ''}
    </span>
  );
}
