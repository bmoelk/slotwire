import type { SlotWireConfig } from '@slotwire/core';
export interface RevalidateHandlerOptions {
    config?: SlotWireConfig;
    webhookSecret?: string;
    onRevalidate?: (payload: RevalidatePayload) => Promise<void> | void;
}
export interface RevalidatePayload {
    event?: string;
    post_type?: string;
    collection?: string;
    slug?: string;
    id?: string | number;
    url?: string;
    paths?: string[];
    [key: string]: any;
}
/**
 * Universal on-demand ISR revalidation webhook endpoint for Astro.
 * Accepts POST requests from WordPress, SlottD, or headless CMS webhooks to trigger cache invalidation.
 */
export declare function handleRevalidateRequest(request: Request, options?: RevalidateHandlerOptions): Promise<Response>;
/**
 * Creates an Astro APIRoute handler for POST /api/slotwire/revalidate
 */
export declare function createRevalidateEndpoint(options?: RevalidateHandlerOptions): ({ request }: {
    request: Request;
}) => Promise<Response>;
export declare const POST: ({ request }: {
    request: Request;
}) => Promise<Response>;
//# sourceMappingURL=revalidate.d.ts.map