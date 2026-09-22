import type { SlotWireConfig } from '@slotwire/core';
export interface AuthGuardOptions {
    config: SlotWireConfig;
    cookieName?: string;
    secretParam?: string;
}
/**
 * Astro middleware security helper to authenticate preview sessions and enforce CSRF integrity.
 */
export declare function createSlotWireAuthGuard(options: AuthGuardOptions): (context: {
    request: Request;
    cookies: any;
    url: URL;
}, next: () => Promise<Response>) => Promise<Response>;
//# sourceMappingURL=auth-guard.d.ts.map