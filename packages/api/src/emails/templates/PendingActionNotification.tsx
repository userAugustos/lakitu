import { Body, Button, Container, Heading, Html, Section, Text } from '@react-email/components';

interface PendingActionNotificationProps {
  agentName: string;
  action: string;
  policyHit: string;
  approvalUrl: string;
}

export default function PendingActionNotification({
  agentName,
  action,
  policyHit,
  approvalUrl,
}: PendingActionNotificationProps) {
  return (
    <Html>
      <Body>
        <Container>
          <Heading>Approval required</Heading>
          <Text>
            Your agent <strong>{agentName}</strong> attempted <strong>{action}</strong> but it
            requires your approval.
          </Text>
          <Text>
            Policy: <strong>{policyHit}</strong>
          </Text>
          <Section>
            <Button href={approvalUrl}>Review in lakitu</Button>
          </Section>
          <Text>If you did not expect this, you can deny the action from the link above.</Text>
        </Container>
      </Body>
    </Html>
  );
}
