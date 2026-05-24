import { notFound } from '@core/errors';

import type { Tool } from './types';

export const TOOL_CATALOG: readonly Tool[] = Object.freeze([
  {
    key: 'stripe.refunds.create',
    provider: 'stripe',
    resource: 'refunds',
    verb: 'create',
    label: 'Create refund',
    description: 'Initiate a refund on a Stripe charge.',
    risk_level: 'critical',
    policy_fields: [
      { key: 'max_amount', label: 'Max amount', type: 'number', placeholder: '1000' },
    ],
  },
  {
    key: 'stripe.charges.create',
    provider: 'stripe',
    resource: 'charges',
    verb: 'create',
    label: 'Create charge',
    description: 'Create a new charge in Stripe.',
    risk_level: 'high',
    policy_fields: [
      { key: 'max_amount', label: 'Max amount', type: 'number', placeholder: '1000' },
    ],
  },
  {
    key: 'stripe.customers.read',
    provider: 'stripe',
    resource: 'customers',
    verb: 'read',
    label: 'Read customers',
    description: 'Read customer records from Stripe.',
    risk_level: 'low',
    policy_fields: [],
  },
  {
    key: 'gmail.messages.send',
    provider: 'gmail',
    resource: 'messages',
    verb: 'send',
    label: 'Send message',
    description: 'Send an email via Gmail.',
    risk_level: 'medium',
    policy_fields: [],
  },
  {
    key: 'gmail.messages.read',
    provider: 'gmail',
    resource: 'messages',
    verb: 'read',
    label: 'Read messages',
    description: 'Read emails from a Gmail inbox.',
    risk_level: 'low',
    policy_fields: [],
  },
  {
    key: 'gmail.drafts.create',
    provider: 'gmail',
    resource: 'drafts',
    verb: 'create',
    label: 'Create draft',
    description: 'Create a new email draft in Gmail.',
    risk_level: 'low',
    policy_fields: [],
  },
  {
    key: 'github.pull_requests.create',
    provider: 'github',
    resource: 'pull_requests',
    verb: 'create',
    label: 'Create pull request',
    description: 'Open a new pull request on GitHub.',
    risk_level: 'high',
    policy_fields: [],
  },
  {
    key: 'github.issues.create',
    provider: 'github',
    resource: 'issues',
    verb: 'create',
    label: 'Create issue',
    description: 'Create a new issue in a GitHub repository.',
    risk_level: 'medium',
    policy_fields: [],
  },
  {
    key: 'github.repos.read',
    provider: 'github',
    resource: 'repos',
    verb: 'read',
    label: 'Read repositories',
    description: 'Read repository data from GitHub.',
    risk_level: 'low',
    policy_fields: [],
  },
  {
    key: 'database.customers.read',
    provider: 'database',
    resource: 'customers',
    verb: 'read',
    label: 'Read customers',
    description: 'Read customer records from the database.',
    risk_level: 'low',
    policy_fields: [],
  },
  {
    key: 'database.customers.export',
    provider: 'database',
    resource: 'customers',
    verb: 'export',
    label: 'Export customers',
    description: 'Export all customer records from the database.',
    risk_level: 'critical',
    policy_fields: [],
  },
  {
    key: 'database.orders.update',
    provider: 'database',
    resource: 'orders',
    verb: 'update',
    label: 'Update orders',
    description: 'Update order records in the database.',
    risk_level: 'high',
    policy_fields: [],
  },
] as const);

const byKey = new Map(TOOL_CATALOG.map((t) => [t.key, t]));

export function getToolByKey(key: string): Tool | null {
  return byKey.get(key) ?? null;
}

export function assertToolExists(key: string): Tool {
  const tool = byKey.get(key);
  if (!tool) {
    throw notFound('tools.unknown_key', `Unknown tool key: ${key}`);
  }
  return tool;
}
