import type { SlotWireConfig } from '@slotwire/core';
import { scaffoldAllSonicCollections } from './scaffold.js';

export function createSlotWirePlugin(config: SlotWireConfig) {
  const collections = scaffoldAllSonicCollections(config);

  return {
    id: 'slotwire-plugin',
    name: 'SlotWire Schema Sync',
    version: '0.1.0',
    description: 'Auto-syncs SlotWire contracts with SonicJS collections and D1 schemas',
    collections,
    async onBoot() {
      console.log(`[SlotWire] Synced ${collections.length} collection(s) from contract.`);
    },
  };
}
