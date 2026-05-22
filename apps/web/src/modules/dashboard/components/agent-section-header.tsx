import { SearchIcon } from '../lib/dashboard-icons';

export function AgentSectionHeader() {
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
          <SearchIcon className="h-3.5 w-3.5" />
          <input
            type="text"
            placeholder="Search agents…"
            className="text-dash-ink placeholder:text-dash-muted min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-0"
            readOnly
          />
          <span className="text-dash-muted border-dash-line bg-dash-gray-bg rounded-[5px] border px-1.5 py-0.5 font-mono text-[10.5px]">
            &#8984;K
          </span>
        </div>
      </div>
    </div>
  );
}
