import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/dashboard')({ component: DashboardPage });

function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div data-testid="dashboard-page" className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome. You are onboarded.</p>
      </div>
    </main>
  );
}
