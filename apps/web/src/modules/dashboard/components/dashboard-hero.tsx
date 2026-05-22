import { Link } from '@tanstack/react-router';

import { authSelectors, useAuthStore } from '@/modules/auth/auth.store';

import { PlusIcon } from '../lib/dashboard-icons';

function formatDayDate(): string {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'short' });
  const date = now.getDate();
  return `${day} · ${month} ${date}`;
}

interface DashboardHeroProps {
  agentCount: number;
}

export function DashboardHero({ agentCount }: DashboardHeroProps) {
  const user = useAuthStore(authSelectors.user);
  const firstName = user?.name?.split(/\s+/)[0] ?? 'there';

  return (
    <section className="mb-6 flex items-end justify-between gap-6">
      <div>
        <div className="text-dash-muted font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">
          {formatDayDate()}
        </div>
        <h1 className="font-display text-dash-ink mt-1.5 text-[30px] leading-tight font-bold tracking-tight">
          Hey {firstName}
        </h1>
        <p className="text-dash-muted mt-1.5 text-[14px]">
          You have <b className="text-dash-ink-2 font-semibold">{agentCount} agents</b> on the grid.
        </p>
      </div>
      <Link
        to="/dashboard/create-agent"
        data-testid="new-agent-button"
        className="bg-dash-ink border-dash-ink inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border px-3.5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#142b4d]"
        style={{ boxShadow: '0 4px 10px rgba(11,27,51,0.18)' }}
      >
        <PlusIcon className="h-3.5 w-3.5" />
        New agent
      </Link>
    </section>
  );
}
