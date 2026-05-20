import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';

import { onboardingService } from './onboarding.service';
import { OnboardingStatusSchema } from './types';

export const onboardingRoutes = new Elysia({
  name: 'onboarding.routes',
  prefix: '/onboarding',
})
  .use(authMiddleware)
  .get('/status', async ({ auth }) => onboardingService.computeStatus(auth.sub), {
    response: OnboardingStatusSchema,
    detail: { summary: 'Onboarding status', tags: ['onboarding'] },
  });
