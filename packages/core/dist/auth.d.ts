import type { TokenPayload, VerifyTokenResult } from './types.js';
/**
 * Generates an HMAC-SHA256 signed preview token with timestamp expiration.
 */
export declare function signPreviewToken(secret: string, payload: TokenPayload): Promise<string>;
export declare const generatePreviewToken: typeof signPreviewToken;
/**
 * Cryptographically verifies an HMAC-SHA256 preview token and checks expiration.
 */
export declare function verifyPreviewToken(secret: string, token: string): Promise<VerifyTokenResult>;
//# sourceMappingURL=auth.d.ts.map