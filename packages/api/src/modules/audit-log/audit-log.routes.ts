import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';
import { authRepository } from '@api/modules/auth/auth.repository';
import { badRequest, unauthorized } from '@core/errors';

import { auditLogService } from './audit-log.service';
import {
  AuditLogListResponseSchema,
  ListAuditLogsQuerySchema,
  VerifyChainResponseSchema,
} from './types';

export const auditLogRoutes = new Elysia({
  name: 'audit-log.routes',
  prefix: '/audit-logs',
})
  .use(authMiddleware)
  .get('/', async ({ auth, query }) => auditLogService.list(auth.sub, query), {
    query: ListAuditLogsQuerySchema,
    response: AuditLogListResponseSchema,
    detail: { summary: 'List audit logs for current company', tags: ['audit-log'] },
  })
  .get(
    '/verify',
    async ({ auth }) => {
      const user = await authRepository.findUserById(auth.sub);
      if (!user) throw unauthorized('auth.user_not_found', 'User not found');
      if (!user.companyId) throw badRequest('auth.no_company', 'User has no company');
      return auditLogService.verifyChain(user.companyId);
    },
    {
      response: VerifyChainResponseSchema,
      detail: { summary: 'Verify audit log hash chain integrity', tags: ['audit-log'] },
    }
  );
