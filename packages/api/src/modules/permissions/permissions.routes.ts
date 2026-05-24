import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';

import { permissionsService } from './permissions.service';
import {
  AgentIdParamSchema,
  GrantPermissionBodySchema,
  GrantPermissionResponseSchema,
  ListPermissionsResponseSchema,
  PermissionToolKeyParamSchema,
  RevokePermissionResponseSchema,
  UpdatePermissionBodySchema,
  UpdatePermissionResponseSchema,
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
    '/:tool_key',
    async ({ auth, params, body }) =>
      permissionsService.update(auth.sub, params.id, params.tool_key, body),
    {
      params: PermissionToolKeyParamSchema,
      body: UpdatePermissionBodySchema,
      response: UpdatePermissionResponseSchema,
      detail: { summary: 'Update a permission for an agent', tags: ['permissions'] },
    }
  )
  .delete(
    '/:tool_key',
    async ({ auth, params }) => permissionsService.revoke(auth.sub, params.id, params.tool_key),
    {
      params: PermissionToolKeyParamSchema,
      response: RevokePermissionResponseSchema,
      detail: { summary: 'Revoke a permission from an agent', tags: ['permissions'] },
    }
  );
