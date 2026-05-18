import { Elysia } from 'elysia';

import { unauthorized } from '@core/errors';

import { jwtManager } from './lib/jwt';

export const authMiddleware = new Elysia({ name: 'auth.middleware' }).derive(
  { as: 'global' },
  async ({ request }) => {
    const header = request.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw unauthorized('auth.missing_token', 'Authorization header required');
    }
    const token = header.slice(7);
    const payload = await jwtManager.verify(token);
    return { auth: payload };
  }
);

export const getAuth = (ctx: { auth: { sub: string; email: string } }) => ctx.auth;
