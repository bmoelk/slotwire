import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SlotWireConfig } from '@slotwire/core';

export interface RevalidateHandlerOptions {
  config?: SlotWireConfig;
  webhookSecret?: string;
  onRevalidate?: (payload: RevalidatePayload) => Promise<void> | void;
}

export interface RevalidatePayload {
  event?: string;
  post_type?: string;
  collection?: string;
  slug?: string;
  id?: string | number;
  url?: string;
  paths?: string[];
  [key: string]: any;
}

/**
 * Verifies webhook cryptographic signature or shared secret.
 */
function verifySignature(
  rawBody: string,
  headers: Headers,
  secret: string
): boolean {
  // 1. Check HMAC-SHA256 signature header: x-slotwire-signature: sha256=<hex> or <hex>
  const signatureHeader =
    headers.get('x-slotwire-signature') ||
    headers.get('x-hub-signature-256');

  if (signatureHeader) {
    const cleanSig = signatureHeader.replace(/^sha256=/i, '').trim();
    const expectedSig = createHmac('sha256', secret).update(rawBody).digest('hex');

    try {
      const sigBuf = Buffer.from(cleanSig, 'hex');
      const expBuf = Buffer.from(expectedSig, 'hex');
      if (sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)) {
        return true;
      }
    } catch {
      // Invalid hex format
    }
  }

  // 2. Check direct token header fallback: x-slotwire-secret or Authorization: Bearer <secret>
  const directSecret = headers.get('x-slotwire-secret') || headers.get('x-slotwire-token');
  if (directSecret && directSecret === secret) {
    return true;
  }

  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer === secret) {
      return true;
    }
  }

  return false;
}

/**
 * Universal on-demand ISR revalidation webhook endpoint for Astro.
 * Accepts POST requests from WordPress, SlottD, or headless CMS webhooks to trigger cache invalidation.
 */
export async function handleRevalidateRequest(
  request: Request,
  options: RevalidateHandlerOptions = {}
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Expected POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const config: SlotWireConfig | undefined =
    options.config || (globalThis as any).__SLOTWIRE_CONFIG__;

  const secret =
    options.webhookSecret ||
    (config as any)?.sync?.webhookSecret ||
    (config as any)?.preview?.secret ||
    (typeof process !== 'undefined' &&
      (process.env?.SLOTWIRE_WEBHOOK_SECRET ||
        process.env?.SLOTWIRE_PREVIEW_SECRET ||
        process.env?.WEBHOOK_SECRET)) ||
    '';

  if (!secret) {
    return new Response(
      JSON.stringify({
        error: 'Revalidation rejected: Webhook secret not configured in SlotWire or environment.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const rawBody = await request.text();

  const isValid = verifySignature(rawBody, request.headers, secret);
  if (!isValid) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden: Invalid x-slotwire-signature or authorization token.',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  let payload: RevalidatePayload = {};
  if (rawBody.trim()) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const slug = payload.slug || '';
  const postType = payload.post_type || payload.collection || 'post';
  const event = payload.event || 'update';

  // Compute affected paths to revalidate
  const paths: string[] = payload.paths || [];
  if (paths.length === 0) {
    if (slug) {
      paths.push(`/${postType}/${slug}`.replace(/\/{2,}/g, '/'));
      if (postType === 'page' || postType === 'pages') {
        paths.push(`/${slug}`);
      }
    }
    if (payload.url) {
      try {
        const parsed = new URL(payload.url, 'http://localhost');
        if (!paths.includes(parsed.pathname)) {
          paths.push(parsed.pathname);
        }
      } catch {}
    }
  }

  // Execute custom onRevalidate callback if defined
  if (options.onRevalidate) {
    try {
      await options.onRevalidate(payload);
    } catch (cbErr: any) {
      console.error('[SlotWire Revalidate] Custom onRevalidate handler error:', cbErr);
    }
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      revalidated: true,
      event,
      post_type: postType,
      slug,
      paths,
      timestamp: Date.now(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Creates an Astro APIRoute handler for POST /api/slotwire/revalidate
 */
export function createRevalidateEndpoint(options: RevalidateHandlerOptions = {}) {
  return async ({ request }: { request: Request }) => {
    return handleRevalidateRequest(request, options);
  };
}

export const POST = createRevalidateEndpoint();
