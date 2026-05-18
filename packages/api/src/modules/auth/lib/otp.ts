import { createHash, randomInt } from 'crypto';

import { config } from '@core/env';
import { badRequest } from '@core/errors';
import { LOG_DOMAINS, logger } from '@core/logger';

const OTP_BYPASS_CODE = '111111';
const otpLogger = logger.child({ domain: LOG_DOMAINS.AUTH });

export const generateNumericCode = (length: number): string => {
  if (length <= 0) throw badRequest('auth.otp_invalid_length', 'Code length must be > 0');
  const bound = 10 ** length;
  return randomInt(bound).toString().padStart(length, '0');
};

export const hashCode = (code: string): string => createHash('sha256').update(code).digest('hex');

export interface OtpBypassDeps {
  isProduction: boolean;
  whitelist: ReadonlyArray<string>;
}

const defaultDeps = (): OtpBypassDeps => ({
  isProduction: config.isProduction,
  whitelist: config.auth.e2eOtpBypassEmails,
});

export const isOtpBypassAllowed = (
  email: string,
  code: string,
  deps: OtpBypassDeps = defaultDeps()
): boolean => {
  if (code !== OTP_BYPASS_CODE) return false;
  const normalized = email.trim().toLowerCase();

  if (!deps.isProduction && normalized.endsWith('@lakitu.test')) return true;

  if (deps.whitelist.includes(normalized)) {
    if (deps.isProduction) {
      otpLogger.warn('otp bypass used (production whitelist)', { email: normalized });
    }
    return true;
  }

  return false;
};
