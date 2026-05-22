import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';
import { config } from '@core/env';

import { pendingActionsService } from './pending-actions.service';
import {
  ListPendingActionsQuerySchema,
  ListPendingActionsResponseSchema,
  PendingActionIdParamSchema,
  PendingActionSchema,
  ResolvePendingActionBodySchema,
  SimulatePendingActionBodySchema,
} from './types';

const simulateRoute = config.isProduction
  ? new Elysia({ name: 'pending-actions.simulate.disabled' })
  : new Elysia({ name: 'pending-actions.simulate' })
      .use(authMiddleware)
      .post('/simulate', async ({ auth, body }) => pendingActionsService.simulate(auth.sub, body), {
        body: SimulatePendingActionBodySchema,
        response: PendingActionSchema,
        detail: { summary: 'Simulate a pending action (dev bypass)', tags: ['pending-actions'] },
      });

export const pendingActionsRoutes = new Elysia({
  name: 'pending-actions.routes',
  prefix: '/pending-actions',
})
  .use(authMiddleware)
  .get('/', async ({ auth, query }) => pendingActionsService.listForOwner(auth.sub, query.status), {
    query: ListPendingActionsQuerySchema,
    response: ListPendingActionsResponseSchema,
    detail: { summary: 'List pending actions for owner', tags: ['pending-actions'] },
  })
  .use(simulateRoute)
  .get('/:id', async ({ auth, params }) => pendingActionsService.getById(auth.sub, params.id), {
    params: PendingActionIdParamSchema,
    response: PendingActionSchema,
    detail: { summary: 'Get a pending action', tags: ['pending-actions'] },
  })
  .post(
    '/:id/approve',
    async ({ auth, params, body }) => pendingActionsService.approve(auth.sub, params.id, body.note),
    {
      params: PendingActionIdParamSchema,
      body: ResolvePendingActionBodySchema,
      response: PendingActionSchema,
      detail: { summary: 'Approve a pending action', tags: ['pending-actions'] },
    }
  )
  .post(
    '/:id/deny',
    async ({ auth, params, body }) => pendingActionsService.deny(auth.sub, params.id, body.note),
    {
      params: PendingActionIdParamSchema,
      body: ResolvePendingActionBodySchema,
      response: PendingActionSchema,
      detail: { summary: 'Deny a pending action', tags: ['pending-actions'] },
    }
  );
