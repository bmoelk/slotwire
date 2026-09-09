import type { SlotWireConfig } from '@slotwire/core';
import { getCmsAdapter } from '@slotwire/core';

export interface QuickSaveHandlerOptions {
  config?: SlotWireConfig;
}

/**
 * Universal quick-save mutation endpoint for Astro staging & dev environments.
 * Dispatches standard REST PATCH/POST updates to Directus, SlottD, or WordPress.
 */
export async function handleQuickSaveRequest(
  request: Request,
  options: QuickSaveHandlerOptions = {}
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Expected POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Enforce CSRF action header
  const actionHeader = request.headers.get('x-slotwire-action');
  if (!actionHeader || actionHeader !== 'quick-save') {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Missing or invalid x-slotwire-action header' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const collection = String(body.collection || '').trim();
  const documentId = String(body.documentId || body.id || '').trim();
  const patchData = body.data;

  if (!collection || !documentId) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: collection and documentId' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!patchData || typeof patchData !== 'object') {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid data object to update' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const config: SlotWireConfig | undefined =
    options.config || (globalThis as any).__SLOTWIRE_CONFIG__;

  const provider =
    config?.cms?.provider ||
    (typeof process !== 'undefined' && (process.env?.CMS_PROVIDER || process.env?.PUBLIC_CMS_PROVIDER)) ||
    'directus';

  const apiUrl =
    config?.cms?.apiUrl ||
    (typeof process !== 'undefined' && (process.env?.CMS_API_URL || process.env?.PUBLIC_CMS_API_URL)) ||
    'http://localhost:8055';

  const apiKey =
    config?.cms?.apiKey ||
    (typeof process !== 'undefined' && (process.env?.CMS_API_KEY || process.env?.SLOTTD_ADMIN_API_KEY || process.env?.DIRECTUS_TOKEN)) ||
    undefined;

  const adapter = getCmsAdapter(provider);

  if (!adapter.updateItem || typeof adapter.updateItem !== 'function') {
    return new Response(
      JSON.stringify({
        error: `CMS adapter for '${provider}' does not support updateItem()`,
      }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const result = await adapter.updateItem(collection, documentId, patchData, { apiUrl, apiKey });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: result.error || 'Update failed',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'ok',
        collection,
        documentId,
        data: result.data,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'Quick save failed unexpectedly',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Creates an Astro APIRoute handler for POST /api/slotwire/quick-save
 */
export function createQuickSaveEndpoint(options: QuickSaveHandlerOptions = {}) {
  return async ({ request }: { request: Request }) => {
    return handleQuickSaveRequest(request, options);
  };
}

export const POST = createQuickSaveEndpoint();
