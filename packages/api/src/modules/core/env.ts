import { helpers } from './env.helpers';

const env = Bun.env;
const { parseBoolean, parseDuration, parseInteger, requireEnv } = helpers;
const environment = env.NODE_ENV ?? 'development';

export const config = {
  environment,
  isDevelopment: environment === 'development',
  isProduction: environment === 'production',
  isTest: environment === 'test',
  app: {
    port: parseInteger(env.PORT, 3000),
    host: env.HOST ?? '0.0.0.0',
    apiUrl: env.API_URL ?? 'http://localhost:3000',
  },
  web: {
    publicUrl: env.WEB_PUBLIC_URL ?? 'http://localhost:5173',
  },
  database: {
    path: env.SQLITE_PATH ?? './data/lakitu.db',
  },
  email: parseBoolean(env.EMAIL_ENABLED, true)
    ? ({
        enabled: true as const,
        smtpHost: env.RESEND_API_KEY ? 'smtp.resend.com' : requireEnv('SMTP_HOST'),
        smtpPort: env.RESEND_API_KEY ? 587 : parseInteger(env.SMTP_PORT, 1025),
        smtpUsername: env.RESEND_API_KEY ? 'resend' : (env.SMTP_USERNAME ?? ''),
        smtpPassword: env.RESEND_API_KEY ?? env.SMTP_PASSWORD ?? '',
        secure: env.RESEND_API_KEY ? false : parseBoolean(env.SMTP_SECURE, false),
      } as const)
    : ({ enabled: false as const } as const),
  auth: {
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtIssuer: env.JWT_ISSUER ?? 'lakitu-api',
    jwtAudience: env.JWT_AUDIENCE ?? 'lakitu-clients',
    jwtTtlSeconds: parseDuration(env.JWT_TTL, 60 * 60 * 24),
    challengeTtlSeconds: parseDuration(env.AUTH_CHALLENGE_TTL, 60 * 15),
    lockDurationSeconds: parseDuration(env.AUTH_LOCK_DURATION, 60 * 60),
    codeLength: parseInteger(env.AUTH_CODE_LENGTH, 6),
    emailFrom: env.AUTH_EMAIL_FROM ?? 'noreply@lakitu.test',
    e2eOtpBypassEmails: (env.E2E_OTP_BYPASS_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  },
  veryAi: {
    baseUrl: env.VERY_AI_BASE_URL ?? 'https://api.very.org/oauth2',
    clientId: env.VERY_AI_CLIENT_ID ?? '',
    clientSecret: env.VERY_AI_CLIENT_SECRET ?? '',
    redirectUri: env.VERY_AI_REDIRECT_URI ?? 'http://localhost:5173/login',
  },
  clawkey: {
    baseUrl: env.CLAWKEY_BASE_URL ?? 'https://api.ag9.ai/v1',
  },
};

export type Config = typeof config;
