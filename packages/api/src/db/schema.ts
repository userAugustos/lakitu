import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
export type AgentRow = typeof agents.$inferSelect;
export type NewAgentRow = typeof agents.$inferInsert;
export type PendingActionRow = typeof pendingActions.$inferSelect;
export type NewPendingActionRow = typeof pendingActions.$inferInsert;
