import type { SlotWireConfig } from '@slotwire/core';
export interface SlotWirePluginOptions {
    config: SlotWireConfig;
    stagingDeployHook?: string;
    productionDeployHook?: string;
    stagingUrl?: string;
    productionUrl?: string;
}
export declare function createSlotWirePlugin(options: SlotWirePluginOptions): {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    collections: any[];
    routes: {
        path: string;
        handler: (app: any) => void;
        description: string;
    }[];
    menuItems: {
        id: string;
        label: string;
        path: string;
        icon: string;
        order: number;
    }[];
    onBoot(): Promise<void>;
};
//# sourceMappingURL=plugin.d.ts.map