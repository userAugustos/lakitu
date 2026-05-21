import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';

import { pendingActionsService } from './pending-actions.service';
import {
  ListPendingActionsQuerySchema,
  ListPendingActionsResponseSchema,
  PendingActionIdParamSchema,
  PendingActionSchema,
  ResolvePendingActionBodySchema,
} from './types';

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
