import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';
import { forbidden } from '@core/errors';

import { onboardingService } from './onboarding.service';

export const onboardingGate = new Elysia({ name: 'onboarding.gate' })
  .use(authMiddleware)
  .derive({ as: 'scoped' }, async ({ auth }) => {
    const status = await onboardingService.computeStatus(auth!.sub);
    if (!status.onboarded) {
      throw forbidden('onboarding_required', 'Onboarding incomplete', {
        retryable: false,
        meta: { next_step: status.next_step },
      });
    }
    return {};
  });
