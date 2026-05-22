import { Resend } from 'resend';

import type { MailTransport, SendArgs } from '../index';

export function createResendTransport(apiKey: string): MailTransport {
  const resend = new Resend(apiKey);

  return {
    async send(args: SendArgs) {
      const { error } = await resend.emails.send({
        from: args.from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });

      if (error) {
        throw new Error(`Resend: ${error.message}`);
      }
    },
  };
}
