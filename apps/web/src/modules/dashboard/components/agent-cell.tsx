const COLOR_VARIANTS: Record<string, string> = {
  v1: 'bg-[#E3F0FF] text-[#1E73CC]',
  v2: 'bg-[#FFE9D9] text-[#C2410C]',
  v3: 'bg-dash-green-bg text-dash-green',
  v4: 'bg-[#EDE3FF] text-[#6B21A8]',
  v5: 'bg-dash-red-bg text-dash-red',
  v6: 'bg-dash-amber-bg text-dash-amber',
  v7: 'bg-[#DCEEFD] text-[#075985]',
};

interface AgentCellProps {
  name: string;
  id: string;
  initials: string;
  colorVariant: string;
  isRevoked: boolean;
}

export function AgentCell({ name, id, initials, colorVariant, isRevoked }: AgentCellProps) {
  const variantClass = COLOR_VARIANTS[colorVariant] ?? COLOR_VARIANTS.v1;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`font-display inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[14px] font-bold ${variantClass}`}
      >
        {initials}
      </div>
      <div className="min-w-0 leading-[1.25]">
        <b
          className={`block text-[14px] font-semibold ${isRevoked ? 'text-dash-muted' : 'text-dash-ink'}`}
        >
          {name}
        </b>
        <span className="text-dash-muted block font-mono text-[11.5px]">{id}</span>
      </div>
    </div>
  );
}
