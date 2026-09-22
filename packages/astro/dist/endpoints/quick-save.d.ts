export declare const prerender = false;
import type { SlotWireConfig } from '@slotwire/core';
export interface QuickSaveHandlerOptions {
    config?: SlotWireConfig;
}
/**
 * Universal quick-save mutation endpoint for Astro staging & dev environments.
 * Dispatches standard REST PATCH/POST updates to Directus, SlottD, or WordPress.
 */
export declare function handleQuickSaveRequest(request: Request, options?: QuickSaveHandlerOptions): Promise<Response>;
/**
 * Creates an Astro APIRoute handler for POST /api/slotwire/quick-save
 */
export declare function createQuickSaveEndpoint(options?: QuickSaveHandlerOptions): ({ request }: {
    request: Request;
}) => Promise<Response>;
export declare const POST: ({ request }: {
    request: Request;
}) => Promise<Response>;
//# sourceMappingURL=quick-save.d.ts.map