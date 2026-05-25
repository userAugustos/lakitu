import { randomUUID } from 'crypto';

import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { Elysia } from 'elysia';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { db } from '@api/db/client';
import { agentsRoutes } from '@api/modules/agents/agents.routes';
import { auditLogRoutes } from '@api/modules/audit-log/audit-log.routes';
import { auditLogService } from '@api/modules/audit-log/audit-log.service';
import { authRoutes } from '@api/modules/auth/auth.routes';
import { companiesRoutes } from '@api/modules/companies/companies.routes';
import { gatewayRoutes } from '@api/modules/gateway/gateway.routes';
import { onboardingRoutes } from '@api/modules/onboarding/onboarding.routes';
import { pendingActionsRoutes } from '@api/modules/pending-actions/pending-actions.routes';
import { permissionsRoutes } from '@api/modules/permissions/permissions.routes';
import { toolsRoutes } from '@api/modules/tools/tools.routes';
import { veryAiRoutes } from '@api/modules/very-ai/very-ai.routes';
import { config } from '@core/env';
import { errorPlugin } from '@core/errors';
import { LOG_DOMAINS, logger } from '@core/logger';
import { enterRequestContext } from '@core/request-context';
import { securityHeaders } from '@core/security-headers';
import { emitMetric } from '@core/telemetry';

const httpLogger = logger.child({ domain: LOG_DOMAINS.HTTP });

const getClientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  'unknown';

export const createApp = () =>
  new Elysia({ name: 'lakitu-api' })
    .use(errorPlugin)
    .use(securityHeaders())
    .onRequest(({ request, set }) => {
      const requestId =
        request.headers.get('x-request-id') ?? request.headers.get('cf-ray') ?? randomUUID();
      set.headers['x-request-id'] = requestId;
      (request as unknown as { __requestId: string }).__requestId = requestId;
      (request as unknown as { __startTime: number }).__startTime = performance.now();
      enterRequestContext(requestId, getClientIp(request));
    })
    .onAfterResponse(({ request, set, path: route }) => {
      if (config.isTest) return;
      const startTime = (request as unknown as { __startTime?: number }).__startTime;
      if (!startTime) return;
      const url = new URL(request.url);
      if (url.pathname === '/healthz') return;
      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      emitMetric('http.request.duration', duration_ms, {
        request_id: (request as unknown as { __requestId?: string }).__requestId,
        method: request.method,
        path: url.pathname,
        route,
        status: (set as { status?: number }).status ?? 200,
      });
    })
    .use(cors())
    .use(
      config.isProduction
        ? new Elysia({ name: 'openapi-disabled' })
        : openapi({
            path: '/docs',
            mapJsonSchema: { zod: zodToJsonSchema },
            documentation: {
              info: { title: 'lakitu API', version: '0.1.0' },
              tags: [],
            },
          })
    )
    .get(
      '/healthz',
      () => ({
        status: 'ok',
        version: process.env.GIT_COMMIT_SHA ?? 'unknown',
        timestamp: new Date().toISOString(),
      }),
      { detail: { summary: 'Health Check', tags: ['system'] } }
    )
    .use(toolsRoutes)
    .use(authRoutes)
    .use(onboardingRoutes)
    .use(veryAiRoutes)
    .use(companiesRoutes)
    .use(agentsRoutes)
    .use(pendingActionsRoutes)
    .use(permissionsRoutes)
    .use(gatewayRoutes)
    .use(auditLogRoutes);

export const lakituApi = createApp();

export type LakituApi = typeof lakituApi;

export const setupApi = async () => {
  httpLogger.info('Running migrations');
  migrate(db, { migrationsFolder: './src/db/migrations' });
  auditLogService.bootstrapChain();
  httpLogger.info('Setup complete', { env: config.environment });
};

export const startApi = async ({ host, port }: { host: string; port: number }) => {
  httpLogger.info('Starting API', { env: config.environment });
  await setupApi();
  return lakituApi.listen({ hostname: host, port }, ({ port }) => {
    httpLogger.info('API listening', { host, port, env: config.environment });
  });
};
