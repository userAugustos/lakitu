export const PLATFORM_AGENT_ACTIONS = [
  {
    value: 'create:transaction',
    label: 'Create transaction',
    description: 'Create financial transactions up to configured limits.',
    policyFields: [
      {
        key: 'max_value',
        label: 'Max value',
        description: 'Largest transaction amount this agent can create.',
        placeholder: '2500',
      },
      {
        key: 'max_by_day',
        label: 'Max by day',
        description: 'Maximum number of transactions this agent can create each day.',
        placeholder: '7',
      },
    ],
  },
  {
    value: 'read:emails',
    label: 'Read emails',
    description: 'Read email threads and mailbox metadata.',
    policyFields: [],
  },
  {
    value: 'reply:email',
    label: 'Reply email',
    description: 'Draft and send replies to email threads.',
    policyFields: [],
  },
  {
    value: 'schedule:call',
    label: 'Schedule call',
    description: 'Create calendar calls with invited participants.',
    policyFields: [],
  },
] as const;

export type PlatformAgentAction = (typeof PLATFORM_AGENT_ACTIONS)[number];
export type PlatformAgentActionValue = PlatformAgentAction['value'];
export type AgentPolicyField = PlatformAgentAction['policyFields'][number];

export const PLATFORM_AGENT_ACTION_VALUES = PLATFORM_AGENT_ACTIONS.map(
  (action) => action.value
) as [PlatformAgentActionValue, ...PlatformAgentActionValue[]];

export function getAgentActionDefinition(action: string): PlatformAgentAction | undefined {
  return PLATFORM_AGENT_ACTIONS.find((candidate) => candidate.value === action);
}

export function formatAgentActionLabel(action: string): string {
  return (
    getAgentActionDefinition(action)?.label ??
    action
      .split(':')
      .map((part) => part.replace(/_/g, ' '))
      .join(' ')
  );
}
