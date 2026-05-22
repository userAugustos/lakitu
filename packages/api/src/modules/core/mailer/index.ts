import { config } from '@core/env';
import { LOG_DOMAINS, logger } from '@core/logger';

import { createResendTransport } from './transports/resend';
import { createSmtpTransport } from './transports/smtp';

const mailLogger = logger.child({ domain: LOG_DOMAINS.MAIL });

export interface SendArgs {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MailTransport {
  send(args: SendArgs): Promise<void>;
}

let _transport: MailTransport | null = null;

function getTransport(): MailTransport | null {
  if (_transport) return _transport;
  if (!config.email.enabled) return null;

  _transport = config.email.resendApiKey
    ? createResendTransport(config.email.resendApiKey)
    : createSmtpTransport(config.email);

  return _transport;
}

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean }> {
  const transport = getTransport();
  if (!transport) {
    mailLogger.warn('Email disabled — skipping send', { to: args.to, subject: args.subject });
    return { ok: true };
  }
  try {
    await transport.send(args);
    mailLogger.info('Email sent', { to: args.to, subject: args.subject });
    return { ok: true };
  } catch (error) {
    mailLogger.error('Email send failed', { error, to: args.to });
    return { ok: false };
  }
}
