import type { SlotWireConfig } from '@slotwire/core';
import { validateContract } from '@slotwire/core';

export interface SlotWireIntegrationOptions {
  config: SlotWireConfig;
  strict?: boolean;
}

export function slotwire(options: SlotWireIntegrationOptions) {
  return {
    name: 'astro-slotwire',
    hooks: {
      'astro:config:setup': async ({ addDevToolbarApp, isRestart }: any) => {
        if (!isRestart) {
          console.log('\n[SlotWire] Initialized schema contract bridge for Astro');
        }

        if (addDevToolbarApp) {
          addDevToolbarApp({
            id: 'slotwire',
            name: 'SlotWire',
            icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#10b981" stroke-width="1.8"/><rect x="16" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#06b6d4" stroke-width="1.8"/><circle cx="5" cy="8.5" r="1.2" fill="#10b981"/><circle cx="5" cy="15.5" r="1.2" fill="#10b981"/><circle cx="19" cy="8.5" r="1.2" fill="#06b6d4"/><circle cx="19" cy="15.5" r="1.2" fill="#06b6d4"/><path d="M6.5 8.5H17.5" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/><path d="M6.5 15.5H17.5" stroke="#06b6d4" stroke-width="1.8" stroke-linecap="round"/></svg>`,
            entrypoint: new URL('./toolbar.js', import.meta.url).pathname,
          });
        }
      },
      'astro:build:start': async () => {
        console.log('\n🔍 [SlotWire] Validating build-time schema contracts vs CMS...');
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
