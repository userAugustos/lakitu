import { Button, Section, Text } from '@react-email/components';

import EmailLayout, { COLORS, FONT_DISPLAY, FONT_SANS } from '../components/EmailLayout';

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
    <EmailLayout preview={`${agentName} needs your approval to ${action}`}>
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
        Approval required
      </Text>

      <Text
        style={{
          margin: '0 0 6px',
          fontSize: '15px',
          lineHeight: '22px',
          color: COLORS.muted,
          fontFamily: FONT_SANS,
        }}
      >
        Your agent <strong style={{ color: COLORS.ink }}>{agentName}</strong> attempted{' '}
        <strong style={{ color: COLORS.ink }}>{action}</strong> but it requires your approval.
      </Text>

      <Text
        style={{
          margin: '0 0 24px',
          fontSize: '13px',
          lineHeight: '18px',
          color: COLORS.muted,
          fontFamily: FONT_SANS,
        }}
      >
        Policy: <strong style={{ color: COLORS.ink }}>{policyHit}</strong>
      </Text>

      <Section style={{ textAlign: 'center' }}>
        <Button
          href={approvalUrl}
          style={{
            display: 'inline-block',
            backgroundColor: COLORS.ink,
            color: COLORS.white,
            fontFamily: FONT_SANS,
            fontSize: '14px',
            fontWeight: 600,
            padding: '10px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
          }}
        >
          Review in Lakitu
        </Button>
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
        If you did not expect this, you can deny the action from the link above.
      </Text>
    </EmailLayout>
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
