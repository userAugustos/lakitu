import { createHash, verify } from 'node:crypto';

import type { GatewayDecideRequest } from '../types';

export function sortedReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((sorted, k) => {
        sorted[k] = (value as Record<string, unknown>)[k];
        return sorted;
      }, {});
  }
  return value;
}

export function verifyAgentSignature(
  body: GatewayDecideRequest,
  signatureBase64: string,
  publicKeyBase64: string
): boolean {
  const bodyJson = JSON.stringify(body, sortedReplacer);
  const sha256Hex = createHash('sha256').update(bodyJson).digest('hex');
  const digest = `${body.nonce}.${body.timestamp}.${sha256Hex}`;

  const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');
  const signature = Buffer.from(signatureBase64, 'base64');

  return verify(
    null,
    Buffer.from(digest),
    { key: publicKeyDer, format: 'der', type: 'spki' },
    signature
  );
}
