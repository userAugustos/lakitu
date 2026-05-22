import { Text } from '@react-email/components';

import EmailLayout, { COLORS, FONT_DISPLAY, FONT_SANS } from '../components/EmailLayout';

export interface WelcomeProps {
  name: string;
}

export default function Welcome({ name }: WelcomeProps) {
  return (
    <EmailLayout preview={`Welcome to Lakitu, ${name}`}>
      <Text
        style={{
          margin: '0 0 8px',
          fontFamily: FONT_DISPLAY,
          fontSize: '22px',
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
        }}
      >
        Welcome, {name}
      </Text>

      <Text
        style={{
          margin: '0 0 0',
          fontSize: '15px',
          lineHeight: '22px',
          color: COLORS.muted,
          fontFamily: FONT_SANS,
        }}
      >
        Thanks for joining Lakitu. You're all set to start managing your agents.
      </Text>
    </EmailLayout>
  );
}

Welcome.subject = ({ name }: WelcomeProps) => `Welcome, ${name}`;

Welcome.PreviewProps = {
  name: 'John Doe',
} satisfies WelcomeProps;
