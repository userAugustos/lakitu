import { generateKeyPairSync, sign } from 'node:crypto';

export interface Ed25519KeyPair {
  publicKeyBase64: string;
  privateKeyBase64: string;
}

export function generateEd25519KeyPair(): Ed25519KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');

  const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });
  const privateKeyDer = privateKey.export({ type: 'pkcs8', format: 'der' });

  return {
    publicKeyBase64: Buffer.from(publicKeyDer).toString('base64'),
    privateKeyBase64: Buffer.from(privateKeyDer).toString('base64'),
  };
}

export function signMessage(privateKeyBase64: string, message: string): string {
  const privateKeyDer = Buffer.from(privateKeyBase64, 'base64');
  const privateKey = {
    key: privateKeyDer,
    format: 'der' as const,
    type: 'pkcs8' as const,
  };
  const signature = sign(null, Buffer.from(message), privateKey);
  return Buffer.from(signature).toString('base64');
}
