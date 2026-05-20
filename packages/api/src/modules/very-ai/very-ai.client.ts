import { config } from '@core/env';

export interface VeryAiTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface VeryAiUserInfo {
  sub: string;
}

function buildAuthorizeUrl({ state }: { state: string }): string {
  const url = new URL(`${config.veryAi.baseUrl}/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.veryAi.clientId);
  url.searchParams.set('redirect_uri', config.veryAi.redirectUri);
  url.searchParams.set('scope', 'openid');
  url.searchParams.set('state', state);
  return url.toString();
}

async function exchangeCode({ code }: { code: string }): Promise<VeryAiTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.veryAi.clientId,
    client_secret: config.veryAi.clientSecret,
    code,
    redirect_uri: config.veryAi.redirectUri,
  });
  const res = await fetch(`${config.veryAi.baseUrl}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VeryAI token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as VeryAiTokenResponse;
}

async function getUserInfo(accessToken: string): Promise<VeryAiUserInfo> {
  const res = await fetch(`${config.veryAi.baseUrl}/userinfo`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VeryAI userinfo failed: ${res.status} ${text}`);
  }
  return (await res.json()) as VeryAiUserInfo;
}

export const veryAiClient = { buildAuthorizeUrl, exchangeCode, getUserInfo };
