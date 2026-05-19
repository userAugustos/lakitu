import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';

import { db } from '@api/db/client';
import { users } from '@api/db/schema';
import { unauthorized } from '@core/errors';

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
  .get(
    '/profile',
    async ({ auth }) => {
      const rows = await db.select().from(users).where(eq(users.id, auth.sub)).limit(1);
      const row = rows[0];
      if (!row) throw unauthorized('auth.user_not_found', 'User not found');
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        status: row.status,
        activated_at: row.activatedAt ? row.activatedAt.getTime() : null,
        created_at: row.createdAt.getTime(),
      };
    },
    {
      response: UserSchema,
      detail: { summary: 'Authed user profile', tags: ['auth'] },
    }
  );

export const authRoutes = new Elysia({ name: 'auth.routes' })
  .use(publicAuthRoutes)
  .use(protectedAuthRoutes);
