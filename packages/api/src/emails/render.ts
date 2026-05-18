import { render } from '@react-email/render';
import { createElement } from 'react';

import AuthOtp from './templates/AuthOtp';
import Welcome from './templates/Welcome';

export async function renderWelcomeEmail(props: { name: string }): Promise<string> {
  return render(createElement(Welcome, props));
}

export async function renderAuthOtpEmail(props: {
  code: string;
  ttlMinutes: number;
}): Promise<string> {
  return render(createElement(AuthOtp, props));
}
