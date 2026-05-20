import { eq } from 'drizzle-orm';

import { db } from '@api/db/client';
import { users, veryAiOauthStates } from '@api/db/schema';
import type { NewVeryAiOauthStateRow, UserRow, VeryAiOauthStateRow } from '@api/db/schema';

async function createState(input: NewVeryAiOauthStateRow): Promise<VeryAiOauthStateRow> {
  const inserted = await db.insert(veryAiOauthStates).values(input).returning();
  return inserted[0]!;
}

async function findState(state: string): Promise<VeryAiOauthStateRow | undefined> {
  const rows = await db
    .select()
    .from(veryAiOauthStates)
    .where(eq(veryAiOauthStates.state, state))
    .limit(1);
  return rows[0];
}

async function deleteState(state: string): Promise<void> {
  db.delete(veryAiOauthStates).where(eq(veryAiOauthStates.state, state)).run();
}

async function deleteStatesByUser(userId: string): Promise<void> {
  db.delete(veryAiOauthStates).where(eq(veryAiOauthStates.userId, userId)).run();
}

async function setUserPending(userId: string): Promise<void> {
  db.update(users).set({ veryAiStatus: 'pending' }).where(eq(users.id, userId)).run();
}

async function setUserVerified(userId: string, subjectId: string): Promise<void> {
  db.update(users)
    .set({
      veryAiSubjectId: subjectId,
      veryAiStatus: 'verified',
      veryAiLastVerificationAt: new Date(),
    })
    .where(eq(users.id, userId))
    .run();
}

async function findUserBySubjectId(subjectId: string): Promise<UserRow | undefined> {
  const rows = await db.select().from(users).where(eq(users.veryAiSubjectId, subjectId)).limit(1);
  return rows[0];
}

export const veryAiRepository = {
  createState,
  findState,
  deleteState,
  deleteStatesByUser,
  setUserPending,
  setUserVerified,
  findUserBySubjectId,
};
