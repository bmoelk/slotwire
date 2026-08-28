import type { SlotWireConfig } from '@slotwire/core';
import { scaffoldAllSonicCollections } from './scaffold.js';
import { renderSlotWireDashboard } from './dashboard.js';

export interface SlotWirePluginOptions {
  config: SlotWireConfig;
  stagingDeployHook?: string;
  productionDeployHook?: string;
  stagingUrl?: string;
  productionUrl?: string;
}

export function createSlotWirePlugin(options: SlotWirePluginOptions) {
  const {
    config,
    stagingDeployHook,
    productionDeployHook,
    stagingUrl = 'https://brainendeavor-staging.pages.dev',
    productionUrl = 'https://brainendeavor.com',
  } = options;

  const collections = scaffoldAllSonicCollections(config);

  return {
    id: 'slotwire-plugin',
    name: 'SlotWire Bridge & Control Center',
    version: '0.2.0',
    description: 'Connects SonicJS with Astro frontend via SlotWire contracts, live preview bridge, and 1-click deployment triggers.',
    collections,
    routes: [
      {
        path: '/admin',
        handler: (app: any) => {
          app.get('/slotwire', (c: any) => {
            const html = renderSlotWireDashboard({
              config,
              stagingUrl,
              productionUrl,
              currentHost: new URL(c.req.url).host,
            });
            return c.html(html);
          });

          app.post('/api/slotwire/deploy', async (c: any) => {
            const target = c.req.query('env') || 'staging';
            const env = c.env as any;

            const hookUrl = target === 'production'
              ? (productionDeployHook || env?.PRODUCTION_DEPLOY_HOOK_URL)
              : (stagingDeployHook || env?.STAGING_DEPLOY_HOOK_URL || env?.DEPLOY_HOOK_URL);

            if (!hookUrl) {
              return c.json({
                success: false,
                error: `No deploy hook URL configured for ${target}. Please configure ${target === 'production' ? 'PRODUCTION_DEPLOY_HOOK_URL' : 'STAGING_DEPLOY_HOOK_URL'} in wrangler.toml.`,
              }, 400);
            }

            try {
              console.log(`[SlotWire] Dispatching ${target} deploy hook: ${hookUrl}`);
              const res = await fetch(hookUrl, { method: 'POST' });
              
              if (res.ok) {
                return c.json({
                  success: true,
                  target,
                  status: res.status,
                  dispatchedAt: new Date().toISOString(),
                });
              } else {
                const text = await res.text();
                return c.json({
                  success: false,
                  target,
                  status: res.status,
                  error: `Cloudflare Pages returned HTTP ${res.status}: ${text}`,
                }, 502);
              }
            } catch (err: any) {
              return c.json({
                success: false,
                target,
                error: `Fetch error: ${err.message}`,
              }, 500);
            }
          });
        },
        description: 'SlotWire Control Center and Deployment routes',
      }
    ],
    menuItems: [
      {
        id: 'slotwire-control-center',
        label: 'SlotWire Bridge',
        path: '/admin/slotwire',
        icon: 'lightning',
        order: 90,
      }
    ],
    async onBoot() {
      console.log(`⚡ [SlotWire Plugin] Control Center registered at /admin/slotwire with ${collections.length} slot schema(s).`);
    },
  };
}
