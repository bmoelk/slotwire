import type { SlotWireConfig } from '@slotwire/core';
export interface D1SyncOptions {
    configPath?: string;
    outputPath?: string;
    viewPrefix?: string;
}
export declare function generateD1ViewsSql(config: SlotWireConfig, options?: {
    viewPrefix?: string;
}): string;
/**
 * Loads slotwire.config.ts / .js and generates D1 SQL view migration.
 */
export declare function syncD1Views(options?: D1SyncOptions): Promise<string>;
//# sourceMappingURL=d1-sync.d.ts.map