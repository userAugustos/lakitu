import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import type { OnboardingStatus } from '@lakitu/api/onboarding';

import { apiCall, ApiResponseError, lakituAuthApi } from '@/api';
import { authActions } from '@/modules/auth/auth.store';
import { mapNextStepToRoute } from '@/modules/onboarding/onboarding.utils';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const token = authActions.getToken();

    if (!token) {
      throw redirect({ to: '/login' });
    }

    let status: OnboardingStatus;

    try {
      status = await apiCall<OnboardingStatus>(() => lakituAuthApi.onboarding.status.get());
    } catch (error: unknown) {
      if (error instanceof ApiResponseError && error.status === 401) {
        authActions.logout();
        throw redirect({ to: '/login' });
      }

      throw error;
    }

    if (!status.onboarded && status.next_step) {
      throw redirect({
        to: '/onboarding/$step',
        params: { step: mapNextStepToRoute(status.next_step) },
      });
    }

    return { onboardingStatus: status };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
