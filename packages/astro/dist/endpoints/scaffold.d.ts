import type { SlotWireConfig } from '@slotwire/core';
export interface ScaffoldHandlerOptions {
    config?: SlotWireConfig;
}
/**
 * Universal scaffolding request handler for Astro staging & dev environments.
 * Dispatches standard REST calls via the active SlotWireCmsAdapter (Directus, SlottD, WordPress, etc.)
 */
export declare function handleScaffoldRequest(request: Request, options?: ScaffoldHandlerOptions): Promise<Response>;
/**
 * Creates an Astro APIRoute handler for POST /api/slotwire/scaffold
 */
export declare function createScaffoldEndpoint(options?: ScaffoldHandlerOptions): ({ request }: {
    request: Request;
}) => Promise<Response>;
export declare const POST: ({ request }: {
    request: Request;
}) => Promise<Response>;
//# sourceMappingURL=scaffold.d.ts.map