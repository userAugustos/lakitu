import type { AgentPermission } from '@lakitu/api/permissions';
import type { Tool } from '@lakitu/api/tools';

export interface ToolAccessContext {
  toolKey: string | null;
  tool: Tool | null;
  policyValues: Record<string, string>;
  autoApprove: boolean;
  error: { message: string } | null;
  grantedPermissions: AgentPermission[];
}

export type ToolAccessEvent =
  | { type: 'SELECT_TOOL'; toolKey: string; tool: Tool }
  | { type: 'CHANGE_POLICY'; key: string; value: string }
  | { type: 'TOGGLE_AUTO_APPROVE' }
  | { type: 'SUBMIT' }
  | { type: 'RESET' }
  | { type: 'RETRY' }
  | { type: 'REMOVE_GRANTED'; toolKey: string };
