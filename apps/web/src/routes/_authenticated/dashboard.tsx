import { createFileRoute } from '@tanstack/react-router';

import type { ListAgentsResponse } from '@lakitu/api/agents';

import { apiCall, lakituAuthApi } from '@/api';

import '@/modules/dashboard/dashboard.css';

import { AnimatedOutlet } from '@/modules/dashboard/components/animated-outlet';
import { AvatarFloat } from '@/modules/dashboard/components/avatar-float';
import { BrandFloat } from '@/modules/dashboard/components/brand-float';
import { CompanyFloat } from '@/modules/dashboard/components/company-float';
import { DashboardHero } from '@/modules/dashboard/components/dashboard-hero';
import { QuickActionsGrid } from '@/modules/dashboard/components/quick-actions-grid';

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: async () => {
    const data = await apiCall<ListAgentsResponse>(() => lakituAuthApi.agents.get());
    return { agents: data.agents, agentCount: data.agents.length };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { agentCount } = Route.useLoaderData();

  return (
    <div className="bg-dash-paper min-h-screen" data-testid="dashboard-page">
      <BrandFloat />
      <AvatarFloat />
      <CompanyFloat />

      <main className="mx-auto max-w-[1400px] px-8 pt-20 pb-30">
        <DashboardHero agentCount={agentCount} />
        <QuickActionsGrid />
        <AnimatedOutlet />
      </main>
    </div>
  );
}
