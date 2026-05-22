const OVERLAY_COLORS: Record<string, string> = {
  v1: 'rgba(30,115,204,0.45)',
  v2: 'rgba(194,65,12,0.45)',
  v3: 'rgba(31,138,91,0.45)',
  v4: 'rgba(107,33,168,0.45)',
  v5: 'rgba(192,54,44,0.45)',
  v6: 'rgba(183,121,31,0.45)',
  v7: 'rgba(7,89,133,0.45)',
};

const AGENT_IMG =
  'https://midias.correiobraziliense.com.br/_midias/jpg/2021/05/20/675x450/1_duran_duran___invisible-6666401.jpg';

interface AgentCellProps {
  name: string;
  id: string;
  colorVariant: string;
  isRevoked: boolean;
}

export function AgentCell({ name, id, colorVariant, isRevoked }: AgentCellProps) {
  const overlay = OVERLAY_COLORS[colorVariant] ?? OVERLAY_COLORS.v1;

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[9px]">
        <img src={AGENT_IMG} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: overlay }} />
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
