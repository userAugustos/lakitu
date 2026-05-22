import { Body, Button, Container, Heading, Html, Section, Text } from '@react-email/components';

export interface PendingActionNotificationProps {
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

PendingActionNotification.subject = ({ agentName, action }: PendingActionNotificationProps) =>
  `Approval required: ${agentName} wants to ${action}`;

PendingActionNotification.PreviewProps = {
  agentName: 'deploy-bot',
  action: 'deploy to production',
  policyHit: 'requires_owner_approval',
  approvalUrl: 'http://localhost:5173/pending-actions/abc-123',
} satisfies PendingActionNotificationProps;
