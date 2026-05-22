import { Section, Text } from '@react-email/components';

import EmailLayout, { COLORS, FONT_DISPLAY, FONT_SANS } from '../components/EmailLayout';

export interface AuthOtpProps {
  code: string;
  ttlMinutes: number;
}

export default function AuthOtp({ code, ttlMinutes }: AuthOtpProps) {
  return (
    <EmailLayout preview={`Your sign-in code: ${code}`}>
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
        Your sign-in code
      </Text>

      <Text
        style={{
          margin: '0 0 24px',
          fontSize: '15px',
          lineHeight: '22px',
          color: COLORS.muted,
          fontFamily: FONT_SANS,
        }}
      >
        Use this code to finish signing in. It expires in {ttlMinutes} minutes.
      </Text>

      <Section
        style={{
          backgroundColor: COLORS.paper,
          borderRadius: '8px',
          border: `1px solid ${COLORS.line}`,
          padding: '20px 0',
          textAlign: 'center',
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: FONT_SANS,
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '6px',
            color: COLORS.ink,
          }}
        >
          {code}
        </Text>
      </Section>

      <Text
        style={{
          margin: '24px 0 0',
          fontSize: '13px',
          lineHeight: '18px',
          color: COLORS.muted,
          fontFamily: FONT_SANS,
        }}
      >
        If you didn't request this code, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

AuthOtp.subject = () => 'Your sign-in code';

AuthOtp.PreviewProps = {
  code: '483291',
  ttlMinutes: 15,
} satisfies AuthOtpProps;
