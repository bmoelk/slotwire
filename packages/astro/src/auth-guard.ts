import type { SlotWireConfig } from '@slotwire/core';
import { verifyPreviewToken } from '@slotwire/core';

export interface AuthGuardOptions {
  config: SlotWireConfig;
  cookieName?: string;
  secretParam?: string;
}

/**
 * Astro middleware security helper to authenticate preview sessions and enforce CSRF integrity.
 */
export function createSlotWireAuthGuard(options: AuthGuardOptions) {
  const {
    config,
    cookieName = 'slotwire_preview',
    secretParam = 'secret',
  } = options;

  return async (
    context: { request: Request; cookies: any; url: URL },
    next: () => Promise<Response>
  ): Promise<Response> => {
    const url = context.url;
    const isSlotWireRoute =
      url.pathname.startsWith('/api/slotwire') ||
      url.pathname === '/api/preview' ||
      url.searchParams.has('slotwire_preview');

    if (!isSlotWireRoute) {
      return next();
    }

    const envSecret = (globalThis as any).process?.env?.SLOTWIRE_PREVIEW_SECRET;
    const expectedSecret = config.cms.previewSecret || envSecret || 'dev-preview-secret';

    // 1. Check for signed preview token in query params
    const token = url.searchParams.get(secretParam) || url.searchParams.get('token');
    if (token) {
      // If token is plain secret match
      if (token === expectedSecret) {
        context.cookies.set(cookieName, 'true', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 4,
        });
      } else {
        // Cryptographic HMAC token verification
        const verifyResult = await verifyPreviewToken(expectedSecret, token);
        if (!verifyResult.valid) {
          return new Response(
            JSON.stringify({ error: `Unauthorized: ${verifyResult.error}` }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        context.cookies.set(cookieName, 'true', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 4,
        });
      }
    }

    // 2. CSRF header verification for mutation requests
    if (context.request.method === 'POST' && url.pathname.startsWith('/api/slotwire')) {
      const actionHeader = context.request.headers.get('x-slotwire-action');
      if (!actionHeader) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Missing x-slotwire-action header' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return next();
  };
}
