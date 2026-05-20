import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { authActions } from '@/modules/auth/auth.store';

export const Route = createFileRoute('/onboarding')({
  beforeLoad: () => {
    const token = authActions.getToken();

    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: OnboardingLayout,
});

function OnboardingLayout() {
  return <Outlet />;
}
