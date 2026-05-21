import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const companies = sqliteTable('companies', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const VERY_AI_STATUSES = ['unlinked', 'pending', 'verified', 'revoked'] as const;
export type VeryAiStatus = (typeof VERY_AI_STATUSES)[number];

export const users = sqliteTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    name: text('name'),
    companyId: text('company_id').references(() => companies.id),
    status: text('status', { enum: ['PENDING', 'ACTIVE', 'LOCKED'] })
      .notNull()
      .default('PENDING'),
    activatedAt: integer('activated_at', { mode: 'timestamp_ms' }),
    veryAiSubjectId: text('very_ai_subject_id').unique(),
    veryAiStatus: text('very_ai_status', { enum: VERY_AI_STATUSES }).notNull().default('unlinked'),
    veryAiLastVerificationAt: integer('very_ai_last_verification_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    companyIdx: index('idx_users_company').on(t.companyId),
  })
);

export const authChallenges = sqliteTable(
  'auth_challenges',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    destination: text('destination').notNull(),
    purpose: text('purpose').notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    consumedAt: integer('consumed_at', { mode: 'timestamp_ms' }),
    failedAttempts: integer('failed_attempts').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    userIdx: index('idx_auth_challenges_user').on(t.userId),
    activeIdx: index('idx_auth_challenges_active').on(t.userId, t.consumedAt),
  })
);

export const veryAiOauthStates = sqliteTable(
  'very_ai_oauth_states',
  {
    state: text('state').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    userIdx: index('idx_very_ai_oauth_states_user').on(t.userId),
  })
);

export const CLAWKEY_STATUSES = ['pending', 'completed', 'expired', 'failed'] as const;
export type ClawKeyStatus = (typeof CLAWKEY_STATUSES)[number];

export const AGENT_STATUSES = ['active', 'revoked'] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const agents = sqliteTable(
  'agents',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id),
    companyId: text('company_id')
      .notNull()
      .references(() => companies.id),
    ed25519PublicKey: text('ed25519_public_key').notNull(),
    ed25519PrivateKey: text('ed25519_private_key').notNull(),
    clawkeySessionId: text('clawkey_session_id'),
    clawkeyStatus: text('clawkey_status', { enum: CLAWKEY_STATUSES }).notNull().default('pending'),
    clawkeyRegisteredAt: integer('clawkey_registered_at', { mode: 'timestamp_ms' }),
    status: text('status', { enum: AGENT_STATUSES }).notNull().default('active'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    ownerIdx: index('idx_agents_owner').on(t.ownerId),
    companyIdx: index('idx_agents_company').on(t.companyId),
  })
);

export const PERMISSION_AUDIT_ACTIONS = ['grant', 'revoke', 'update_policy'] as const;
export type PermissionAuditAction = (typeof PERMISSION_AUDIT_ACTIONS)[number];

export const agentPermissions = sqliteTable(
  'agent_permissions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id),
    action: text('action').notNull(),
    policyLimits: text('policy_limits'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    agentActionUniq: uniqueIndex('uniq_agent_permissions_agent_action').on(t.agentId, t.action),
    agentIdx: index('idx_agent_permissions_agent').on(t.agentId),
  })
);

export const permissionAuditLog = sqliteTable(
  'permission_audit_log',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    action: text('action').notNull(),
    auditAction: text('audit_action', { enum: PERMISSION_AUDIT_ACTIONS }).notNull(),
    oldPolicyLimits: text('old_policy_limits'),
    newPolicyLimits: text('new_policy_limits'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    agentIdx: index('idx_permission_audit_agent').on(t.agentId, t.createdAt),
    userIdx: index('idx_permission_audit_user').on(t.userId, t.createdAt),
  })
);

export const PENDING_ACTION_STATUSES = ['pending', 'approved', 'denied', 'expired'] as const;
export type PendingActionStatus = (typeof PENDING_ACTION_STATUSES)[number];

export const pendingActions = sqliteTable(
  'pending_actions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id),
    companyId: text('company_id')
      .notNull()
      .references(() => companies.id),
    action: text('action').notNull(),
    context: text('context').notNull(),
    policyHit: text('policy_hit').notNull(),
    auditId: text('audit_id'),
    status: text('status', { enum: PENDING_ACTION_STATUSES }).notNull().default('pending'),
    resolutionNote: text('resolution_note'),
    resolvedBy: text('resolved_by').references(() => users.id),
    resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    ownerIdx: index('idx_pending_actions_owner').on(t.ownerId),
    agentIdx: index('idx_pending_actions_agent').on(t.agentId),
    statusIdx: index('idx_pending_actions_status').on(t.status),
    expiresIdx: index('idx_pending_actions_expires').on(t.status, t.expiresAt),
  })
);

export type CompanyRow = typeof companies.$inferSelect;
export type NewCompanyRow = typeof companies.$inferInsert;
export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type AuthChallengeRow = typeof authChallenges.$inferSelect;
export type NewAuthChallengeRow = typeof authChallenges.$inferInsert;
export type VeryAiOauthStateRow = typeof veryAiOauthStates.$inferSelect;
export type NewVeryAiOauthStateRow = typeof veryAiOauthStates.$inferInsert;

export const AUDIT_DECISIONS = [
  'allow',
  'deny',
  'approval_required',
  'approved',
  'denied',
  'expired',
] as const;
export type AuditDecision = (typeof AUDIT_DECISIONS)[number];

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    auditId: text('audit_id').notNull(),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id),
    companyId: text('company_id')
      .notNull()
      .references(() => companies.id),
    action: text('action').notNull(),
    decision: text('decision', { enum: AUDIT_DECISIONS }).notNull(),
    reasons: text('reasons').notNull(),
    policyHit: text('policy_hit'),
    requestId: text('request_id'),
    context: text('context'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    agentCreatedIdx: index('idx_audit_logs_agent_created').on(t.agentId, t.createdAt),
    ownerCreatedIdx: index('idx_audit_logs_owner_created').on(t.ownerId, t.createdAt),
    decisionIdx: index('idx_audit_logs_decision').on(t.decision),
    auditIdIdx: index('idx_audit_logs_audit_id').on(t.auditId),
  })
);

export type AgentRow = typeof agents.$inferSelect;
export type NewAgentRow = typeof agents.$inferInsert;
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type NewAuditLogRow = typeof auditLogs.$inferInsert;
export type AgentPermissionRow = typeof agentPermissions.$inferSelect;
export type NewAgentPermissionRow = typeof agentPermissions.$inferInsert;
export type PermissionAuditLogRow = typeof permissionAuditLog.$inferSelect;
export type NewPermissionAuditLogRow = typeof permissionAuditLog.$inferInsert;
export type PendingActionRow = typeof pendingActions.$inferSelect;
export type NewPendingActionRow = typeof pendingActions.$inferInsert;
