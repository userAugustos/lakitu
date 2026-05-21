interface JwtPayload {
  sub: string;
  email: string;
  exp?: number;
  iat?: number;
}

function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((input.length + 2) % 4);
  return atob(padded);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const json = base64urlDecode(parts[1]!);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp < nowSeconds;
}
