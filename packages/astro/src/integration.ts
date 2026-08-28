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
      'astro:config:setup': async ({ isRestart }: { isRestart: boolean }) => {
        if (!isRestart) {
          console.log('\n⚡ [SlotWire] Initialized schema contract bridge for Astro');
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
