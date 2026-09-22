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
export declare function slotwire(options: SlotWireIntegrationOptions): {
    name: string;
    hooks: {
        'astro:config:setup': ({ config, addDevToolbarApp, updateConfig, injectRoute, isRestart }: any) => Promise<void>;
        'astro:build:start': () => Promise<void>;
    };
};
//# sourceMappingURL=integration.d.ts.map