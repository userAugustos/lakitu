import { render } from '@react-email/render';
import { createElement } from 'react';

import AuthOtp from './templates/AuthOtp';
import PendingActionNotification from './templates/PendingActionNotification';
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

export async function renderPendingActionEmail(props: {
  agentName: string;
  action: string;
  policyHit: string;
  approvalUrl: string;
}): Promise<string> {
  return render(createElement(PendingActionNotification, props));
}
