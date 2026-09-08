import type { SlotWireConfig, ScaffoldBundle } from '@slotwire/core';
import { getCmsAdapter, generateArchetypeScaffoldBundle } from '@slotwire/core';

export interface ScaffoldHandlerOptions {
  config?: SlotWireConfig;
}

/**
 * Universal scaffolding request handler for Astro staging & dev environments.
 * Dispatches standard REST calls via the active SlotWireCmsAdapter (Directus, SlottD, WordPress, etc.)
 */
export async function handleScaffoldRequest(
  request: Request,
  options: ScaffoldHandlerOptions = {}
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Expected POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
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

  const targetSlug = String(
    body.targetSlug || body.pageSlug || body.slug || ''
  ).trim().replace(/^\/+|\/+$/g, '');

  const targetTitle = String(
    body.targetTitle || body.title || ''
  ).trim() || targetSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const template = String(body.template || body.archetypeKey || 'standard');
  const addToNav = Boolean(body.addToNav ?? body.addToMenu ?? false);
  const navMenu = String(body.navMenu || body.menuKey || 'header_main');
  const navLabel = String(body.navLabel || body.menuLabel || targetTitle);

  if (!targetSlug) {
    return new Response(JSON.stringify({ error: 'Missing required parameter: targetSlug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const config: SlotWireConfig | undefined =
    options.config || (globalThis as any).__SLOTWIRE_CONFIG__;

  // Generate the scaffold bundle from Archetype contracts
  let bundle: ScaffoldBundle;
  if (config) {
    bundle = generateArchetypeScaffoldBundle(config, template, {
      pageSlug: targetSlug,
      title: targetTitle,
      addToNav,
      navMenu,
      customData: body.customData,
    });
  } else {
    // Fallback minimal bundle if config is not globally registered
    bundle = {
      template,
      slug: targetSlug,
      title: targetTitle,
      records: [
        {
          collection: 'pages',
          data: {
            slug: targetSlug,
            title: targetTitle,
            template,
            status: 'draft',
          },
        },
      ],
      previewUrl: `/${targetSlug}?slotwire_preview=true`,
    };
    if (addToNav) {
      bundle.records.push({
        collection: 'site_navigation',
        data: {
          title: navLabel,
          link: `/${targetSlug}`,
          menuKey: navMenu,
          order: 99,
        },
      });
    }
  }

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

  if (!adapter.scaffoldBundle || typeof adapter.scaffoldBundle !== 'function') {
    return new Response(
      JSON.stringify({
        error: `CMS adapter for '${provider}' does not support scaffoldBundle()`,
      }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const result = await adapter.scaffoldBundle(bundle, { apiUrl, apiKey });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: result.errors?.[0] || 'Scaffolding execution failed',
          result,
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
        slug: result.targetSlug,
        createdCount: result.createdCount,
        createdIds: result.createdIds,
        targetUrl: result.targetUrl || `/${targetSlug}?slotwire_preview=true`,
        previewUrl: result.previewUrl || `/${targetSlug}?slotwire_preview=true`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'Scaffolding failed unexpectedly',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Creates an Astro APIRoute handler for POST /api/slotwire/scaffold
 */
export function createScaffoldEndpoint(options: ScaffoldHandlerOptions = {}) {
  return async ({ request }: { request: Request }) => {
    return handleScaffoldRequest(request, options);
  };
}

export const POST = createScaffoldEndpoint();
