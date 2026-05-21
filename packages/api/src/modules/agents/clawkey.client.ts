import { apiFetch } from '@core/api-fetch';
import { config } from '@core/env';

export interface ClawKeyRegisterInitRequest {
  deviceId: string;
  publicKey: string;
  message: string;
  signature: string;
  timestamp: number;
}

export interface ClawKeyRegisterInitResponse {
  sessionId: string;
  registrationUrl: string;
  expiresAt: number;
}

export interface ClawKeyStatusResponse {
  status: 'pending' | 'completed' | 'expired' | 'failed';
  deviceId: string;
  registration: {
    publicKey: string;
    registeredAt: number;
  } | null;
}

async function registerInit(
  body: ClawKeyRegisterInitRequest
): Promise<ClawKeyRegisterInitResponse> {
  const result = await apiFetch<ClawKeyRegisterInitResponse>(
    `${config.clawkey.baseUrl}/agent/register/init`,
    { method: 'POST', body }
  );
  if (!result.ok) throw new Error(`ClawKey register/init failed: ${result.status}`);
  return result.data;
}

async function getSessionStatus(sessionId: string): Promise<ClawKeyStatusResponse> {
  const result = await apiFetch<ClawKeyStatusResponse>(
    `${config.clawkey.baseUrl}/agent/register/${sessionId}/status`
  );
  if (!result.ok) throw new Error(`ClawKey status check failed: ${result.status}`);
  return result.data;
}

export const clawkeyClient = { registerInit, getSessionStatus };
