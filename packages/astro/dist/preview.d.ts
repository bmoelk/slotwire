import type { SlotWireConfig } from '@slotwire/core';
export interface PreviewHandlerOptions {
    config: SlotWireConfig;
    secretParam?: string;
    cookieName?: string;
}
export declare function createPreviewHandler(options: PreviewHandlerOptions): ({ request, cookies, redirect }: {
    request: Request;
    cookies: any;
    redirect: (url: string) => Response;
}) => Promise<Response>;
/**
 * Handles in-situ Pre-Create batch scaffolding requests dispatched from the frontend preview modal.
 * Delegates to the universal standard REST handler handleScaffoldRequest.
 */
export declare function createScaffoldHandler(config: SlotWireConfig): ({ request }: {
    request: Request;
    cookies?: any;
}) => Promise<Response>;
/**
 * Handles on-demand SSR slot fragment evaluation for zero-reload View Transition morphing.
 */
export declare function createSlotRenderHandler(config: SlotWireConfig, slotRenderer?: (slot: string, pageSlug: string) => Promise<string>): ({ request, cookies }: {
    request: Request;
    cookies: any;
}) => Promise<Response>;
//# sourceMappingURL=preview.d.ts.map