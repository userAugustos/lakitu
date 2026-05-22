import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import '@/modules/dashboard/dashboard.css';

import { AnimatedOutlet } from '@/modules/dashboard/components/animated-outlet';
import { AvatarFloat } from '@/modules/dashboard/components/avatar-float';
import { BrandFloat } from '@/modules/dashboard/components/brand-float';
import { CompanyFloat } from '@/modules/dashboard/components/company-float';
import { DashboardHero } from '@/modules/dashboard/components/dashboard-hero';
import { QuickActionsGrid } from '@/modules/dashboard/components/quick-actions-grid';
import { agentsQueryOptions } from '@/modules/dashboard/lib/agents-query';
import { myCompanyQueryOptions } from '@/modules/dashboard/lib/my-company-query';

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(myCompanyQueryOptions);
    return context.queryClient.ensureQueryData(agentsQueryOptions);
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data } = useQuery(agentsQueryOptions);

  return (
    <div className="bg-dash-paper min-h-screen" data-testid="dashboard-page">
      <BrandFloat />
      <AvatarFloat />
      <CompanyFloat />

      <main className="mx-auto max-w-[1400px] px-8 pt-20 pb-30">
        <DashboardHero agentCount={data?.agents.length ?? 0} />
        <QuickActionsGrid />
        <AnimatedOutlet />
      </main>
    </div>
  );
}
