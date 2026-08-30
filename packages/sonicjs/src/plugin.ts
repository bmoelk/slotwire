import type { SlotWireConfig } from '@slotwire/core';
import { scaffoldAllSonicCollections, scaffoldBlueprint } from './scaffold.js';
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
    id: 'slotwire',
    name: 'SlotWire',
    version: '0.2.0',
    description: 'Connects SonicJS with Astro frontend via SlotWire contracts, live preview bridge, and 1-click deployment triggers.',
    author: 'BrainEndeavor',
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

          app.post('/api/slotwire/scaffold-blueprint', async (c: any) => {
            try {
              const body = await c.req.json();
              const blueprint = body.blueprint || body;
              const env = c.env as any;

              const result = await scaffoldBlueprint(blueprint, {
                d1: env?.DB || env?.D1,
                cmsApiUrl: new URL(c.req.url).origin,
              });

              return c.json(result, result.success ? 200 : 400);
            } catch (err: any) {
              return c.json({ success: false, error: err.message }, 500);
            }
          });

          app.post('/api/slotwire/tickets', async (c: any) => {
            try {
              const ticket = await c.req.json();
              const env = c.env as any;
              const d1 = env?.DB || env?.D1;

              if (d1) {
                const now = new Date().toISOString();
                await d1
                  .prepare(
                    `INSERT INTO slotwire_tickets (id, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
                  )
                  .bind(ticket.ticketId, JSON.stringify(ticket), ticket.status || 'open', now, now)
                  .run()
                  .catch(async () => {
                    // Fallback
                    await d1
                      .prepare(
                        `INSERT OR REPLACE INTO slotwire_tickets (id, ticketId, title, description, status, route, slotKey, collection, pageSlug)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                      )
                      .bind(
                        ticket.ticketId,
                        ticket.ticketId,
                        ticket.title,
                        ticket.description,
                        ticket.status || 'open',
                        ticket.context?.route || '',
                        ticket.context?.slotKey || '',
                        ticket.context?.collection || '',
                        ticket.context?.pageSlug || ''
                      )
                      .run();
                  });
              }

              return c.json({ success: true, ticketId: ticket.ticketId });
            } catch (err: any) {
              return c.json({ success: false, error: err.message }, 500);
            }
          });

          app.get('/api/slotwire/tickets', async (c: any) => {
            try {
              const env = c.env as any;
              const d1 = env?.DB || env?.D1;

              if (d1) {
                const res = await d1
                  .prepare(`SELECT * FROM slotwire_tickets WHERE status != 'resolved' ORDER BY created_at DESC LIMIT 50`)
                  .all();
                const tickets = (res.results || []).map((row: any) => {
                  try {
                    return typeof row.data === 'string' ? JSON.parse(row.data) : row;
                  } catch {
                    return row;
                  }
                });
                return c.json({ success: true, tickets });
              }

              return c.json({ success: true, tickets: [] });
            } catch (err: any) {
              return c.json({ success: false, error: err.message, tickets: [] }, 500);
            }
          });

          app.patch('/api/slotwire/tickets/:id/resolve', async (c: any) => {
            try {
              const ticketId = c.req.param('id');
              const env = c.env as any;
              const d1 = env?.DB || env?.D1;

              if (d1) {
                await d1
                  .prepare(`UPDATE slotwire_tickets SET status = 'resolved', updated_at = ? WHERE id = ? OR ticketId = ?`)
                  .bind(new Date().toISOString(), ticketId, ticketId)
                  .run();
              }

              return c.json({ success: true, ticketId, status: 'resolved' });
            } catch (err: any) {
              return c.json({ success: false, error: err.message }, 500);
            }
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
        description: 'SlotWire Deployment and Preview routes',
      }
    ],
    menuItems: [
      {
        id: 'slotwire',
        label: 'SlotWire',
        path: '/admin/slotwire',
        icon: 'bolt',
        order: 40,
      }
    ],
    async onBoot() {
      console.log(`⚡ [SlotWire Plugin] Registered at /admin/slotwire with ${collections.length} slot schema(s).`);
    },
  };
}
