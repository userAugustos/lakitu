import { assign, fromPromise, setup } from 'xstate';

import type { GrantPermissionResponse } from '@lakitu/api/permissions';

import { apiCall, lakituAuthApi } from '@/api';

import type { ToolAccessContext, ToolAccessEvent } from './tool-access.types';

export function createToolAccessMachine(agentId: string) {
  return setup({
    types: {} as {
      context: ToolAccessContext;
      events: ToolAccessEvent;
    },
    actors: {
      grantPermissionActor: fromPromise(
        async ({
          input,
        }: {
          input: {
            agentId: string;
            toolKey: string;
            policyLimits: Record<string, unknown> | null;
            autoApprove: boolean;
          };
        }) => {
          return apiCall<GrantPermissionResponse>(() =>
            lakituAuthApi.agents[input.agentId]!.permissions.post({
              tool_key: input.toolKey,
              policy_limits: input.policyLimits,
              auto_approve: input.autoApprove,
            })
          );
        }
      ),
    },
    guards: {
      isCritical: ({ context }) => context.tool?.risk_level === 'critical',
      canShowAutoApprove: ({ context }) => context.tool?.risk_level === 'high',
      canSubmit: ({ context }) => {
        if (!context.tool || !context.toolKey) return false;
        for (const field of context.tool.policy_fields) {
          const val = context.policyValues[field.key];
          if (!val?.trim()) return false;
          if (field.type === 'number' && !Number.isFinite(Number(val))) return false;
        }
        return true;
      },
    },
  }).createMachine({
    id: 'toolAccess',
    initial: 'idle',
    context: {
      toolKey: null,
      tool: null,
      policyValues: {},
      autoApprove: false,
      error: null,
      grantedPermissions: [],
    },

    states: {
      idle: {
        entry: assign({
          error: null,
          toolKey: null,
          tool: null,
          policyValues: {},
          autoApprove: false,
        }),
        on: {
          SELECT_TOOL: {
            target: 'toolSelected',
            actions: assign(({ event }) => ({
              toolKey: event.toolKey,
              tool: event.tool,
              policyValues: {},
              autoApprove: false,
            })),
          },
          REMOVE_GRANTED: {
            actions: assign(({ context, event }) => ({
              grantedPermissions: context.grantedPermissions.filter(
                (p) => p.tool_key !== event.toolKey
              ),
            })),
          },
        },
      },

      toolSelected: {
        on: {
          SELECT_TOOL: {
            actions: assign(({ event }) => ({
              toolKey: event.toolKey,
              tool: event.tool,
              policyValues: {},
              autoApprove: false,
              error: null,
            })),
          },
          CHANGE_POLICY: {
            actions: assign(({ context, event }) => ({
              policyValues: { ...context.policyValues, [event.key]: event.value },
            })),
          },
          TOGGLE_AUTO_APPROVE: {
            actions: assign(({ context }) => ({ autoApprove: !context.autoApprove })),
          },
          SUBMIT: {
            target: 'submitting',
          },
          RESET: {
            target: 'idle',
          },
          REMOVE_GRANTED: {
            actions: assign(({ context, event }) => ({
              grantedPermissions: context.grantedPermissions.filter(
                (p) => p.tool_key !== event.toolKey
              ),
            })),
          },
        },
      },

      submitting: {
        invoke: {
          src: 'grantPermissionActor',
          input: ({ context }) => {
            const policyLimits: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(context.policyValues)) {
              const field = context.tool?.policy_fields.find((f) => f.key === key);
              policyLimits[key] = field?.type === 'number' ? Number(val) : val;
            }
            return {
              agentId,
              toolKey: context.toolKey!,
              policyLimits: Object.keys(policyLimits).length > 0 ? policyLimits : null,
              autoApprove: context.autoApprove,
            };
          },
          onDone: {
            target: 'idle',
            actions: assign(({ context, event }) => ({
              grantedPermissions: [...context.grantedPermissions, event.output.permission],
              error: null,
            })),
          },
          onError: {
            target: 'error',
            actions: assign(({ event }) => ({
              error: { message: (event.error as Error).message ?? 'Failed to grant permission' },
            })),
          },
        },
      },

      error: {
        on: {
          RETRY: 'submitting',
          SELECT_TOOL: {
            target: 'toolSelected',
            actions: assign(({ event }) => ({
              toolKey: event.toolKey,
              tool: event.tool,
              policyValues: {},
              autoApprove: false,
              error: null,
            })),
          },
          RESET: 'idle',
          REMOVE_GRANTED: {
            actions: assign(({ context, event }) => ({
              grantedPermissions: context.grantedPermissions.filter(
                (p) => p.tool_key !== event.toolKey
              ),
            })),
          },
        },
      },
    },
  });
}
