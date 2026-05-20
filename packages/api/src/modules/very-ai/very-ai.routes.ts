import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';

import { veryAiService } from './very-ai.service';
import {
  CallbackQuerySchema,
  CallbackResponseSchema,
  StartLinkResponseSchema,
} from './types';

const protectedRoutes = new Elysia({
  name: 'very-ai.routes.protected',
  prefix: '/onboarding/very-ai',
})
  .use(authMiddleware)
  .post('/start', async ({ auth }) => veryAiService.startLink(auth.sub), {
    response: StartLinkResponseSchema,
    detail: { summary: 'Start VeryAI OAuth2 link', tags: ['onboarding', 'very-ai'] },
  });

const publicRoutes = new Elysia({
  name: 'very-ai.routes.public',
  prefix: '/onboarding/very-ai',
}).get('/callback', async ({ query }) => veryAiService.completeLink(query), {
  query: CallbackQuerySchema,
  response: CallbackResponseSchema,
  detail: { summary: 'Complete VeryAI OAuth2 link', tags: ['onboarding', 'very-ai'] },
});

export const veryAiRoutes = new Elysia({ name: 'very-ai.routes' })
  .use(protectedRoutes)
  .use(publicRoutes);
