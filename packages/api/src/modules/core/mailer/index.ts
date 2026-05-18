import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { config } from '@core/env';
import { LOG_DOMAINS, logger } from '@core/logger';

const mailLogger = logger.child({ domain: LOG_DOMAINS.MAIL });

let _transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (_transport) return _transport;
  if (!config.email.enabled) return null;
  _transport = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.secure,
    auth: config.email.smtpUsername
      ? { user: config.email.smtpUsername, pass: config.email.smtpPassword }
      : undefined,
  });
  return _transport;
}

export interface SendArgs {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean }> {
  const transport = getTransport();
  if (!transport) {
    mailLogger.warn('Email disabled — skipping send', { to: args.to, subject: args.subject });
    return { ok: true };
  }
  try {
    await transport.sendMail(args);
    mailLogger.info('Email sent', { to: args.to, subject: args.subject });
    return { ok: true };
  } catch (error) {
    mailLogger.error('Email send failed', { error, to: args.to });
    return { ok: false };
  }
}
