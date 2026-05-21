import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';

import { permissionsService } from './permissions.service';
import {
  AgentIdParamSchema,
  GrantPermissionBodySchema,
  GrantPermissionResponseSchema,
  ListPermissionAuditResponseSchema,
  ListPermissionsResponseSchema,
  PermissionActionParamSchema,
  RevokePermissionResponseSchema,
  UpdatePolicyBodySchema,
  UpdatePolicyResponseSchema,
} from './types';

export const permissionsRoutes = new Elysia({
  name: 'permissions.routes',
  prefix: '/agents/:id/permissions',
})
  .use(authMiddleware)
  .get('/', async ({ auth, params }) => permissionsService.list(auth.sub, params.id), {
    params: AgentIdParamSchema,
    response: ListPermissionsResponseSchema,
    detail: { summary: 'List permissions for an agent', tags: ['permissions'] },
  })
  .post(
    '/',
    async ({ auth, params, body }) => permissionsService.grant(auth.sub, params.id, body),
    {
      params: AgentIdParamSchema,
      body: GrantPermissionBodySchema,
      response: GrantPermissionResponseSchema,
      detail: { summary: 'Grant a permission to an agent', tags: ['permissions'] },
    }
  )
  .patch(
    '/:action/policy',
    async ({ auth, params, body }) =>
      permissionsService.updatePolicy(auth.sub, params.id, params.action, body),
    {
      params: PermissionActionParamSchema,
      body: UpdatePolicyBodySchema,
      response: UpdatePolicyResponseSchema,
      detail: { summary: 'Update policy limits for a permission', tags: ['permissions'] },
    }
  )
  .delete(
    '/:action',
    async ({ auth, params }) => permissionsService.revoke(auth.sub, params.id, params.action),
    {
      params: PermissionActionParamSchema,
      response: RevokePermissionResponseSchema,
      detail: { summary: 'Revoke a permission from an agent', tags: ['permissions'] },
    }
  )
  .get('/audit', async ({ auth, params }) => permissionsService.listAudit(auth.sub, params.id), {
    params: AgentIdParamSchema,
    response: ListPermissionAuditResponseSchema,
    detail: { summary: 'List permission audit log for an agent', tags: ['permissions'] },
  });
