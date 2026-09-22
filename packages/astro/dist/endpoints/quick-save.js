export const prerender = false;
import { getCmsAdapter } from '@slotwire/core';
/**
 * Universal quick-save mutation endpoint for Astro staging & dev environments.
 * Dispatches standard REST PATCH/POST updates to Directus, SlottD, or WordPress.
 */
export async function handleQuickSaveRequest(request, options = {}) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed. Expected POST.' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    // Enforce CSRF action header
    const actionHeader = request.headers.get('x-slotwire-action');
    if (!actionHeader || actionHeader !== 'quick-save') {
        return new Response(JSON.stringify({ error: 'Forbidden: Missing or invalid x-slotwire-action header' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    let body;
    try {
        body = await request.json();
    }
    catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const collection = String(body.collection || '').trim();
    const documentId = String(body.documentId || body.id || '').trim();
    const patchData = body.data;
    if (!collection || !documentId) {
        console.error('[SlotWire Quick Save] Missing collection or documentId:', { collection, documentId });
        return new Response(JSON.stringify({ error: 'Missing required parameters: collection and documentId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    if (!patchData || typeof patchData !== 'object') {
        console.error('[SlotWire Quick Save] Missing or invalid patchData:', patchData);
        return new Response(JSON.stringify({ error: 'Missing or invalid data object to update' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    // Enforce direct publishing unless specifically requested otherwise
    if (!patchData.status || body.publish === true) {
        patchData.status = 'published';
    }
    const config = options.config || globalThis.__SLOTWIRE_CONFIG__;
    const provider = config?.cms?.provider ||
        (typeof process !== 'undefined' && (process.env?.CMS_PROVIDER || process.env?.PUBLIC_CMS_PROVIDER)) ||
        'directus';
    const defaultPort = provider === 'slottd' ? '8787' : '8055';
    const apiUrl = config?.cms?.apiUrl ||
        (typeof process !== 'undefined' && (process.env?.CMS_API_URL || process.env?.PUBLIC_CMS_API_URL)) ||
        `http://localhost:${defaultPort}`;
    // Forward incoming client authentication credentials
    const forwardHeaders = {};
    const clientAuth = request.headers.get('authorization') || request.headers.get('Authorization');
    if (clientAuth) {
        forwardHeaders['Authorization'] = clientAuth;
    }
    const cookie = request.headers.get('cookie');
    if (cookie) {
        forwardHeaders['Cookie'] = cookie;
    }
    const cfEmail = request.headers.get('cf-access-authenticated-user-email');
    if (cfEmail) {
        forwardHeaders['cf-access-authenticated-user-email'] = cfEmail;
    }
    const cfJwt = request.headers.get('cf-access-jwt-assertion');
    if (cfJwt) {
        forwardHeaders['cf-access-jwt-assertion'] = cfJwt;
    }
    const apiKey = config?.cms?.apiKey ||
        (typeof process !== 'undefined' && (process.env?.CMS_API_KEY || process.env?.SLOTTD_ADMIN_API_KEY || process.env?.ADMIN_API_KEY || process.env?.DIRECTUS_TOKEN)) ||
        undefined;
    // Zero-Backdoor Security Gate: Write operations require authenticated client credentials or configured CMS key
    if (!clientAuth && !apiKey && !cookie && !cfEmail) {
        console.warn(`[SlotWire Quick Save] Blocked unauthenticated write attempt to ${collection}/${documentId}`);
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Write operations require an authenticated CMS session. Please sign in via the Quick Edit drawer.',
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    console.log(`[SlotWire Quick Save] Mutating ${collection}/${documentId} via provider '${provider}' (status: ${patchData.status}, clientAuth: ${Boolean(clientAuth)})`);
    const adapter = getCmsAdapter(provider);
    if (!adapter.updateItem || typeof adapter.updateItem !== 'function') {
        return new Response(JSON.stringify({
            error: `CMS adapter for '${provider}' does not support updateItem()`,
        }), {
            status: 501,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    try {
        const result = await adapter.updateItem(collection, documentId, patchData, {
            apiUrl,
            apiKey,
            headers: forwardHeaders,
        });
        if (!result.success) {
            console.error(`[SlotWire Quick Save] Adapter error updating ${collection}/${documentId}:`, result.error);
            return new Response(JSON.stringify({
                error: result.error || 'Update failed in CMS',
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        console.log(`[SlotWire Quick Save] Successfully published ${collection}/${documentId}`);
        return new Response(JSON.stringify({
            status: 'ok',
            collection,
            documentId,
            data: result.data,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    catch (err) {
        console.error(`[SlotWire Quick Save] Unexpected exception for ${collection}/${documentId}:`, err);
        return new Response(JSON.stringify({
            error: err.message || 'Quick save failed unexpectedly',
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
/**
 * Creates an Astro APIRoute handler for POST /api/slotwire/quick-save
 */
export function createQuickSaveEndpoint(options = {}) {
    return async ({ request }) => {
        return handleQuickSaveRequest(request, options);
    };
}
export const POST = createQuickSaveEndpoint();
//# sourceMappingURL=quick-save.js.map