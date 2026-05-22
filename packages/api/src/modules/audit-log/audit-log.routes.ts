import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';

import { auditLogService } from './audit-log.service';
import { AuditLogListResponseSchema, ListAuditLogsQuerySchema } from './types';

export const auditLogRoutes = new Elysia({
  name: 'audit-log.routes',
  prefix: '/audit-logs',
})
  .use(authMiddleware)
  .get('/', async ({ auth, query }) => auditLogService.list(auth.sub, query), {
    query: ListAuditLogsQuerySchema,
    response: AuditLogListResponseSchema,
    detail: { summary: 'List audit logs for current company', tags: ['audit-log'] },
  });
