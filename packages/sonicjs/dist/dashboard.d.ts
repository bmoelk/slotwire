import type { SlotWireConfig } from '@slotwire/core';
export interface DashboardOptions {
    config: SlotWireConfig;
    stagingUrl?: string;
    productionUrl?: string;
    currentHost?: string;
    embedded?: boolean;
}
export declare function renderSlotWireDashboard(options: DashboardOptions): string;
//# sourceMappingURL=dashboard.d.ts.map