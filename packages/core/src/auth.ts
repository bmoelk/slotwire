import type { TokenPayload, VerifyTokenResult } from './types.js';

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Generates an HMAC-SHA256 signed preview token with timestamp expiration.
 */
export async function signPreviewToken(
  secret: string,
  payload: TokenPayload
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await getHmacKey(secret);
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(dataToSign)
  );

  let binary = '';
  const bytes = new Uint8Array(signatureBytes);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const signatureB64 = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${dataToSign}.${signatureB64}`;
}

/**
 * Cryptographically verifies an HMAC-SHA256 preview token and checks expiration.
 */
export async function verifyPreviewToken(
  secret: string,
  token: string
): Promise<VerifyTokenResult> {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Empty or invalid token format' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToSign = `${headerB64}.${payloadB64}`;

    // Verify HMAC Signature
    let sigBase64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (sigBase64.length % 4) {
      sigBase64 += '=';
    }
    const sigBinary = atob(sigBase64);
    const signatureBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      signatureBytes[i] = sigBinary.charCodeAt(i);
    }

    const key = await getHmacKey(secret);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(dataToSign)
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payloadJson = base64UrlDecode(payloadB64);
    const payload: TokenPayload = JSON.parse(payloadJson);

    // Expiration check
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && nowSec > payload.exp) {
      return { valid: false, error: 'Token expired', payload };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: `Verification failed: ${err.message}` };
  }
}
