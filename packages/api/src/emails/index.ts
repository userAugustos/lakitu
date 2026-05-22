import { render } from '@react-email/render';
import { createElement } from 'react';

import AuthOtp from './templates/AuthOtp';
import PendingActionNotification from './templates/PendingActionNotification';
import Welcome from './templates/Welcome';
import type { AuthOtpProps } from './templates/AuthOtp';
import type { PendingActionNotificationProps } from './templates/PendingActionNotification';
import type { WelcomeProps } from './templates/Welcome';

const templates = {
  AuthOtp,
  Welcome,
  PendingActionNotification,
} as const;

type TemplateMap = {
  AuthOtp: AuthOtpProps;
  Welcome: WelcomeProps;
  PendingActionNotification: PendingActionNotificationProps;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTemplate = (props: any) => React.JSX.Element;

export async function buildEmail<K extends keyof TemplateMap>(
  name: K,
  props: TemplateMap[K]
): Promise<{ subject: string; html: string }> {
  const component = templates[name] as AnyTemplate & { subject: (props: never) => string };
  const html = await render(createElement(component, props));
  const subject = component.subject(props as never);
  return { subject, html };
}

export type { AuthOtpProps, PendingActionNotificationProps, WelcomeProps };
