import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const VERY_AI_STATUSES = ['unlinked', 'pending', 'verified', 'revoked'] as const;
export type VeryAiStatus = (typeof VERY_AI_STATUSES)[number];

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
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
});

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

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type AuthChallengeRow = typeof authChallenges.$inferSelect;
export type NewAuthChallengeRow = typeof authChallenges.$inferInsert;
export type VeryAiOauthStateRow = typeof veryAiOauthStates.$inferSelect;
export type NewVeryAiOauthStateRow = typeof veryAiOauthStates.$inferInsert;
