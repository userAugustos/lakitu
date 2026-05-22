import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';

import { agentsService } from './agents.service';
import {
  AgentClawKeyStatusResponseSchema,
  AgentIdParamSchema,
  AgentSchema,
  CreateAgentBodySchema,
  CreateAgentResponseSchema,
  ListAgentsResponseSchema,
  RotateKeyResponseSchema,
} from './types';

export const agentsRoutes = new Elysia({
  name: 'agents.routes',
  prefix: '/agents',
})
  .use(authMiddleware)
  .post('/', async ({ auth, body }) => agentsService.create(auth.sub, body), {
    body: CreateAgentBodySchema,
    response: CreateAgentResponseSchema,
    detail: { summary: 'Create an agent', tags: ['agents'] },
  })
  .get('/', async ({ auth }) => agentsService.list(auth.sub), {
    response: ListAgentsResponseSchema,
    detail: { summary: 'List agents for current company', tags: ['agents'] },
  })
  .get(
    '/:id/clawkey/status',
    async ({ auth, params }) => agentsService.pollClawKeyStatus(auth.sub, params.id),
    {
      params: AgentIdParamSchema,
      response: AgentClawKeyStatusResponseSchema,
      detail: { summary: 'Poll ClawKey registration status', tags: ['agents'] },
    }
  )
  .patch('/:id/revoke', async ({ auth, params }) => agentsService.revoke(auth.sub, params.id), {
    params: AgentIdParamSchema,
    response: AgentSchema,
    detail: { summary: 'Revoke an agent', tags: ['agents'] },
  })
  .patch('/:id/restore', async ({ auth, params }) => agentsService.restore(auth.sub, params.id), {
    params: AgentIdParamSchema,
    response: AgentSchema,
    detail: { summary: 'Restore a revoked agent', tags: ['agents'] },
  })
  .post(
    '/:id/rotate-key',
    async ({ auth, params }) => agentsService.rotateKey(auth.sub, params.id),
    {
      params: AgentIdParamSchema,
      response: RotateKeyResponseSchema,
      detail: { summary: 'Rotate agent keys', tags: ['agents'] },
    }
  )
  .patch(
    '/:id/clawkey/bypass',
    async ({ auth, params }) => agentsService.bypassClawKey(auth.sub, params.id),
    {
      params: AgentIdParamSchema,
      response: AgentSchema,
      detail: { summary: 'Bypass ClawKey registration', tags: ['agents'] },
    }
  );
