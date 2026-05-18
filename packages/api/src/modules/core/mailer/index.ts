import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { config } from '@core/env';
import { LOG_DOMAINS, logger } from '@core/logger';

const mailLogger = logger.child({ domain: LOG_DOMAINS.MAIL });

let _transport: Transporter | null = null;

function getTransport(): Transporter {
  if (_transport) return _transport;
  if (!config.email.enabled) {
    mailLogger.warn('Email disabled — using JSON transport');
    _transport = nodemailer.createTransport({ jsonTransport: true });
    return _transport;
  }
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
  try {
    await getTransport().sendMail(args);
    mailLogger.info('Email sent', { to: args.to, subject: args.subject });
    return { ok: true };
  } catch (error) {
    mailLogger.error('Email send failed', { error, to: args.to });
    return { ok: false };
  }
}
