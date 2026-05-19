import { Elysia } from 'elysia';

import { authMiddleware } from './auth.middleware';
import { authService } from './auth.service';
import {
  ChallengeRequestSchema,
  ChallengeResponseSchema,
  ChallengeVerifySchema,
  UserSchema,
  VerifyResponseSchema,
} from './types';

const publicAuthRoutes = new Elysia({ name: 'auth.routes.public', prefix: '/auth' })
  .post('/challenge', async ({ body }) => authService.requestChallenge(body), {
    body: ChallengeRequestSchema,
    response: ChallengeResponseSchema,
    detail: { summary: 'Request OTP challenge', tags: ['auth'] },
  })
  .post('/verify', async ({ body }) => authService.verifyChallenge(body), {
    body: ChallengeVerifySchema,
    response: VerifyResponseSchema,
    detail: { summary: 'Verify OTP and issue JWT', tags: ['auth'] },
  });

const protectedAuthRoutes = new Elysia({ name: 'auth.routes.protected', prefix: '/auth' })
  .use(authMiddleware)
  .get('/profile', async ({ auth }) => authService.profile(auth.sub), {
    response: UserSchema,
    detail: { summary: 'Authed user profile', tags: ['auth'] },
  });

export const authRoutes = new Elysia({ name: 'auth.routes' })
  .use(publicAuthRoutes)
  .use(protectedAuthRoutes);
