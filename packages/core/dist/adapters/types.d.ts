import type { CmsDeepLinkOptions, ScaffoldBundle, ScaffoldResult } from '../types.js';
export interface DocumentContext {
    collection: string;
    documentId: string;
    slug: string;
    status: 'draft' | 'published';
    data: Record<string, unknown>;
}
export interface SlotWireCmsAdapter {
    readonly provider: string;
    buildAdminLink(context: CmsDeepLinkOptions): string;
    getAuthLoginUrl?(apiUrl: string, returnOrigin: string): string;
    getAuthMeUrl?(apiUrl: string): string;
    resolveDocumentContext?(context: unknown): DocumentContext;
    scaffoldBundle?(bundle: ScaffoldBundle, credentials?: {
        apiUrl?: string;
        apiKey?: string;
    }): Promise<ScaffoldResult>;
    fetchCollection?(collection: string, options?: {
        filter?: any;
        sort?: any;
        limit?: number;
        credentials?: {
            apiUrl?: string;
            apiKey?: string;
        };
    }): Promise<any[]>;
    updateItem?(collection: string, id: string, data: Record<string, any>, credentials?: {
        apiUrl?: string;
        apiKey?: string;
        siteId?: string;
        headers?: Record<string, string>;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map