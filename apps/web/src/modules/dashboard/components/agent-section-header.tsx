import { SearchIcon } from '../lib/dashboard-icons';

interface AgentSectionHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function AgentSectionHeader({ searchValue, onSearchChange }: AgentSectionHeaderProps) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <h2 className="font-display text-dash-ink text-[18px] font-bold tracking-[-0.015em]">
        Agents
      </h2>
      <div className="flex items-center gap-2">
        <div
          data-testid="agent-search"
          className="border-dash-line text-dash-muted inline-flex w-60 items-center gap-2 rounded-[10px] border bg-white px-2.5 py-[7px]"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0" />
          <input
            type="text"
            placeholder="Search agents…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-dash-ink placeholder:text-dash-muted min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-0"
          />
        </div>
      </div>
    </div>
  );
}
