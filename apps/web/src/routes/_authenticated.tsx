import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import type { OnboardingStatus } from '@lakitu/api/onboarding';

import { apiCall, ApiResponseError, lakituAuthApi } from '@/api';
import { authActions } from '@/modules/auth/auth.store';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const token = authActions.getToken();

    if (!token) {
      authActions.setReturnUrl(location.pathname);
      throw redirect({ to: '/login' });
    }

    let status: OnboardingStatus;

    try {
      status = await apiCall<OnboardingStatus>(() => lakituAuthApi.onboarding.status.get());
    } catch (error: unknown) {
      if (error instanceof ApiResponseError && error.status === 401) {
        authActions.logout();
        authActions.setReturnUrl(location.pathname);
        throw redirect({ to: '/login' });
      }

      throw error;
    }

    if (!status.onboarded) {
      authActions.setReturnUrl(location.pathname);
      throw redirect({ to: '/login' });
    }

    return { onboardingStatus: status };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
