import { and, eq, gt, isNull } from 'drizzle-orm';

import { db } from '@api/db/client';
import { authChallenges, users } from '@api/db/schema';
import type { AuthChallengeRow, NewAuthChallengeRow, NewUserRow, UserRow } from '@api/db/schema';

export const authRepository = {
  async findUserByEmail(email: string): Promise<UserRow | undefined> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
    return rows[0];
  },

  async createUser(input: NewUserRow): Promise<UserRow> {
    const inserted = await db
      .insert(users)
      .values({ ...input, email: input.email.trim().toLowerCase() })
      .returning();
    return inserted[0]!;
  },

  async setUserStatus(
    userId: string,
    status: UserRow['status'],
    extras?: { activatedAt?: Date | null; lockedAt?: Date | null; lockedReason?: string | null }
  ): Promise<void> {
    db.update(users)
      .set({
        status,
        activatedAt: extras?.activatedAt ?? undefined,
        lockedAt: extras?.lockedAt ?? undefined,
        lockedReason: extras?.lockedReason ?? undefined,
      })
      .where(eq(users.id, userId))
      .run();
  },

  async createChallenge(input: NewAuthChallengeRow): Promise<AuthChallengeRow> {
    const inserted = await db.insert(authChallenges).values(input).returning();
    return inserted[0]!;
  },

  async findValidChallengeByCode(
    userId: string,
    codeHash: string
  ): Promise<AuthChallengeRow | undefined> {
    const rows = await db
      .select()
      .from(authChallenges)
      .where(
        and(
          eq(authChallenges.userId, userId),
          eq(authChallenges.codeHash, codeHash),
          isNull(authChallenges.consumedAt),
          gt(authChallenges.expiresAt, new Date())
        )
      )
      .limit(1);
    return rows[0];
  },

  async consumeChallenge(challengeId: string): Promise<void> {
    db.update(authChallenges)
      .set({ consumedAt: new Date() })
      .where(eq(authChallenges.id, challengeId))
      .run();
  },

  async incrementFailedAttempts(userId: string): Promise<void> {
    const active = db
      .select()
      .from(authChallenges)
      .where(and(eq(authChallenges.userId, userId), isNull(authChallenges.consumedAt)))
      .limit(1)
      .all();
    const row = active[0];
    if (!row) return;
    db.update(authChallenges)
      .set({ failedAttempts: row.failedAttempts + 1 })
      .where(eq(authChallenges.id, row.id))
      .run();
  },
};
