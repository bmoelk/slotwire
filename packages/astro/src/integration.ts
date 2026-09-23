import { fileURLToPath } from 'node:url';
import type { SlotWireConfig } from '@slotwire/core';

export interface SlotWireIntegrationOptions {
  config: SlotWireConfig;
  strict?: boolean;
  devToolbar?: boolean;
  injectEndpoints?: {
    scaffold?: boolean;
    quickSave?: boolean;
    revalidate?: boolean;
  };
}

export function slotwire(options: SlotWireIntegrationOptions) {
  return {
    name: 'astro-slotwire',
    hooks: {
      'astro:config:setup': async ({ config, addDevToolbarApp, updateConfig, injectRoute, isRestart }: any) => {
        (globalThis as any).__SLOTWIRE_CONFIG__ = options.config;

        if (!isRestart) {
          console.log('\n[SlotWire] Initialized schema contract bridge for Astro');
        }

        if (injectRoute) {
          const endpoints = options.injectEndpoints || {};
          if (endpoints.scaffold !== false) {
            injectRoute({
              pattern: '/api/slotwire/scaffold',
              entrypoint: fileURLToPath(new URL('./endpoints/scaffold.js', import.meta.url)),
            });
          }
          if (endpoints.quickSave !== false) {
            injectRoute({
              pattern: '/api/slotwire/quick-save',
              entrypoint: fileURLToPath(new URL('./endpoints/quick-save.js', import.meta.url)),
            });
          }
          if (endpoints.revalidate !== false) {
            injectRoute({
              pattern: '/api/slotwire/revalidate',
              entrypoint: fileURLToPath(new URL('./endpoints/revalidate.js', import.meta.url)),
            });
          }
        }

        if (updateConfig) {
          const packageDir = fileURLToPath(new URL('..', import.meta.url));
          const projectRoot = fileURLToPath(config.root);
          const parentDir = fileURLToPath(new URL('..', config.root));
          const codeDir = fileURLToPath(new URL('../..', config.root));
          const allowPaths = Array.from(new Set([codeDir, parentDir, projectRoot, process.cwd(), packageDir]));

          const siteId = options.config.siteId || options.config.cms?.siteId || '';
          const apiUrl = options.config.cms?.apiUrl || '';
          const adminUrl = options.config.cms?.adminUrl || (apiUrl ? `${apiUrl.replace(/\/+$/, '')}/admin` : '');

          updateConfig({
            vite: {
              define: {
                'import.meta.env.CMS_SITE_ID': JSON.stringify(siteId),
                'import.meta.env.CMS_API_URL': JSON.stringify(apiUrl),
                'import.meta.env.CMS_ADMIN_URL': JSON.stringify(adminUrl),
              },
              server: {
                fs: {
                  allow: allowPaths,
                },
              },
              optimizeDeps: {
                exclude: ['astro-slotwire', '@slotwire/core'],
              },
            },
          });
        }

        if (addDevToolbarApp && options.devToolbar !== false) {
          addDevToolbarApp({
            id: 'slotwire',
            name: 'SlotWire',
            icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#10b981" stroke-width="1.8"/><rect x="16" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#06b6d4" stroke-width="1.8"/><circle cx="5" cy="8.5" r="1.2" fill="#10b981"/><circle cx="5" cy="15.5" r="1.2" fill="#10b981"/><circle cx="19" cy="8.5" r="1.2" fill="#06b6d4"/><circle cx="19" cy="15.5" r="1.2" fill="#06b6d4"/><path d="M6.5 8.5H17.5" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/><path d="M6.5 15.5H17.5" stroke="#06b6d4" stroke-width="1.8" stroke-linecap="round"/></svg>`,
            entrypoint: fileURLToPath(new URL('./toolbar.js', import.meta.url)),
          });
        }
      },
      'astro:build:start': async () => {
        console.log('\n🔍 [SlotWire] Validating build-time schema contracts vs CMS...');
        const { validateContract } = await import('@slotwire/core');
        const report = await validateContract(options.config);
        
        console.log(`⚡ [SlotWire] Validation Report: ${report.validSlots}/${report.totalSlots} slots fully covered.`);
        if (!report.isFullyCovered) {
          report.results
            .filter((r) => r.status !== 'valid')
            .forEach((r) => {
              console.warn(`  ⚠️  Slot '${r.slotKey}' (${r.status}): ${r.populatedFields}/${r.totalFields} fields populated.`);
            });

          if (options.strict) {
            throw new Error('[SlotWire] Build halted: CMS content does not satisfy strict contract requirements.');
          }
        }
      },
    },
  };
}
