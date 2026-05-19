import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import { config } from '@core/env';
import { unauthorized } from '@core/errors';

export interface TokenPayload {
  sub: string;
  email: string;
  iss?: string;
  aud?: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

const base64url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

const base64urlDecode = (input: string): Buffer => {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((input.length + 2) % 4);
  return Buffer.from(padded, 'base64');
};

const HEADER = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

const sign256 = (data: string, secret: string): string =>
  base64url(createHmac('sha256', secret).update(data).digest());

async function sign(userId: string, extra: { email: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: userId,
    email: extra.email,
    iss: config.auth.jwtIssuer,
    aud: config.auth.jwtAudience,
    jti: randomUUID(),
    iat: now,
    exp: now + config.auth.jwtTtlSeconds,
  };
  const body = `${HEADER}.${base64url(JSON.stringify(payload))}`;
  const sig = sign256(body, config.auth.jwtSecret);
  return `${body}.${sig}`;
}

async function verify(token: string): Promise<TokenPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw unauthorized('auth.invalid_token', 'Invalid or expired token');
  }
  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];
  const expected = sign256(`${headerB64}.${payloadB64}`, config.auth.jwtSecret);
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(sigB64);
  if (expectedBytes.length !== actualBytes.length || !timingSafeEqual(expectedBytes, actualBytes)) {
    throw unauthorized('auth.invalid_token', 'Invalid or expired token');
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64).toString('utf8')) as TokenPayload;
  } catch {
    throw unauthorized('auth.invalid_token', 'Invalid or expired token');
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw unauthorized('auth.invalid_token', 'Invalid or expired token');
  }
  if (payload.iss !== config.auth.jwtIssuer || payload.aud !== config.auth.jwtAudience) {
    throw unauthorized('auth.invalid_token', 'Invalid or expired token');
  }
  return payload;
}

export const jwtManager = { sign, verify };
