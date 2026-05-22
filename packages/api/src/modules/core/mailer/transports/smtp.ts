import nodemailer from 'nodemailer';

import type { MailTransport, SendArgs } from '../index';

interface SmtpConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  secure: boolean;
}

export function createSmtpTransport(cfg: SmtpConfig): MailTransport {
  const transporter = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.secure,
    auth: cfg.smtpUsername ? { user: cfg.smtpUsername, pass: cfg.smtpPassword } : undefined,
  });

  return {
    async send(args: SendArgs) {
      await transporter.sendMail(args);
    },
  };
}
