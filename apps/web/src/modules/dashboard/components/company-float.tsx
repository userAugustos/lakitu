import { ChevronDownIcon } from '../lib/dashboard-icons';

export function CompanyFloat() {
  return (
    <button
      type="button"
      aria-label="Switch workspace"
      data-testid="company-float"
      className="border-dash-line fixed bottom-5 left-5 z-20 inline-flex cursor-pointer items-center gap-2.5 rounded-xl border bg-white py-2.5 pr-3.5 pl-2.5 transition-[transform,box-shadow] duration-[120ms] ease-[ease] hover:-translate-y-px max-[880px]:hidden"
      style={{
        boxShadow: '0 10px 24px rgba(11,27,51,0.10), 0 2px 6px rgba(11,27,51,0.06)',
      }}
    >
      <div
        className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-[13px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #1E73CC, #0B1B33)' }}
      >
        PT
      </div>
      <div className="min-w-0">
        <div className="text-dash-ink text-[13px] leading-[1.2] font-semibold">Pipeshift Tech</div>
        <div className="text-dash-muted text-[11.5px] leading-[1.2]">Team &middot; 12 members</div>
      </div>
      <ChevronDownIcon className="text-dash-muted ml-1 h-3.5 w-3.5 shrink-0" />
    </button>
  );
}
