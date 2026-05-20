import { randomUUID } from 'crypto';

import { authRepository } from '@api/modules/auth/auth.repository';
import { badRequest, unauthorized } from '@core/errors';

import { veryAiClient } from './very-ai.client';
import { veryAiRepository } from './very-ai.repository';
import type { CallbackResponse, StartLinkResponse } from './types';

const STATE_TTL_MS = 10 * 60 * 1000;

async function startLink(userId: string): Promise<StartLinkResponse> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');

  await veryAiRepository.deleteStatesByUser(userId);

  const state = randomUUID();
  const nonce = randomUUID();
  const expiresAt = new Date(Date.now() + STATE_TTL_MS);

  await veryAiRepository.createState({ state, userId, nonce, expiresAt });

  if (user.veryAiStatus !== 'verified') {
    await veryAiRepository.setUserPending(userId);
  }

  return { authorize_url: veryAiClient.buildAuthorizeUrl({ state, nonce }) };
}

async function completeLink(input: { code: string; state: string }): Promise<CallbackResponse> {
  const stateRow = await veryAiRepository.findState(input.state);
  if (!stateRow) throw badRequest('very_ai.invalid_state', 'Invalid or expired link state');
  if (stateRow.expiresAt.getTime() < Date.now()) {
    await veryAiRepository.deleteState(input.state);
    throw badRequest('very_ai.invalid_state', 'Invalid or expired link state');
  }

  let tokens;
  try {
    tokens = await veryAiClient.exchangeCode({ code: input.code });
  } catch {
    throw badRequest('very_ai.token_exchange_failed', 'Could not exchange code with VeryAI');
  }

  let userinfo;
  try {
    userinfo = await veryAiClient.getUserInfo(tokens.access_token);
  } catch {
    throw badRequest('very_ai.userinfo_failed', 'Could not load VeryAI user info');
  }

  const existing = await veryAiRepository.findUserBySubjectId(userinfo.sub);
  if (existing && existing.id !== stateRow.userId) {
    throw badRequest(
      'very_ai.subject_already_linked',
      'This VeryAI identity is linked to another account'
    );
  }

  await veryAiRepository.setUserVerified(stateRow.userId, userinfo.sub);
  await veryAiRepository.deleteState(input.state);

  return { ok: true, status: 'verified', subject_id: userinfo.sub };
}

export const veryAiService = { startLink, completeLink };
