import type { CmsDeepLinkOptions, ScaffoldBundle, ScaffoldResult } from '../types.js';
import type { SlotWireCmsAdapter, DocumentContext } from './types.js';
export declare abstract class BaseCmsAdapter implements SlotWireCmsAdapter {
    abstract readonly provider: string;
    abstract buildAdminLink(options: CmsDeepLinkOptions): string;
    resolveDocumentContext?(context: unknown): DocumentContext;
    getAuthLoginUrl(apiUrl: string, returnOrigin: string): string;
    getAuthMeUrl(apiUrl: string): string;
    protected cleanBaseUrl(url: string): string;
    protected buildQueryParams(pageSlug?: string, sectionKey?: string, siteId?: string): string;
    /**
     * Returns the item endpoint for creating, updating, or deleting single records.
     * Default implementation follows the Directus/SlottD /items/:collection standard.
     */
    getItemEndpoint(apiUrl: string, collection: string, id?: string): string;
    /**
     * Returns the collection query endpoint for reading multiple records.
     */
    getCollectionEndpoint(apiUrl: string, collection: string, options?: {
        filter?: any;
        sort?: any;
        limit?: number;
    }): string;
    /**
     * Universal CMS-agnostic scaffolding engine with compensation rollback.
     */
    scaffoldBundle(bundle: ScaffoldBundle, credentials?: {
        apiUrl?: string;
        apiKey?: string;
    }): Promise<ScaffoldResult>;
    /**
     * Compensating transactions: attempts to clean up created items if a bundle fails.
     */
    protected rollbackRecords(apiUrl: string, headers: Record<string, string>, createdRecords: Array<{
        collection: string;
        id?: string;
    }>): Promise<void>;
    /**
     * Universal collection fetcher for loaders and schema validators.
     */
    fetchCollection(collection: string, options?: {
        filter?: any;
        sort?: any;
        limit?: number;
        credentials?: {
            apiUrl?: string;
            apiKey?: string;
        };
    }): Promise<any[]>;
    /**
     * Universal item updater using standard Directus/SlottD REST PATCH.
     */
    updateItem(collection: string, id: string, data: Record<string, any>, credentials?: {
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
//# sourceMappingURL=base.d.ts.map