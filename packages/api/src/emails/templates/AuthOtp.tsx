import { Body, Container, Heading, Html, Section, Text } from '@react-email/components';

export interface AuthOtpProps {
  code: string;
  ttlMinutes: number;
}

export default function AuthOtp({ code, ttlMinutes }: AuthOtpProps) {
  return (
    <Html>
      <Body>
        <Container>
          <Heading>Your sign-in code</Heading>
          <Text>Use this code to finish signing in:</Text>
          <Section>
            <Text style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px' }}>
              {code}
            </Text>
          </Section>
          <Text>This code expires in {ttlMinutes} minutes.</Text>
        </Container>
      </Body>
    </Html>
  );
}

AuthOtp.subject = () => 'Your sign-in code';

AuthOtp.PreviewProps = {
  code: '483291',
  ttlMinutes: 15,
} satisfies AuthOtpProps;
