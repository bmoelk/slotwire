import type { CmsDeepLinkOptions } from '../types.js';
import { BaseCmsAdapter } from './base.js';
export declare class WordPressAdapter extends BaseCmsAdapter {
    readonly provider = "wordpress";
    protected cleanBaseUrl(url: string): string;
    buildAdminLink(options: CmsDeepLinkOptions): string;
    getAuthLoginUrl(apiUrl: string, returnOrigin: string): string;
    getAuthMeUrl(apiUrl: string): string;
    getSlotwireContentEndpoint(apiUrl: string, collection: string, id?: string): string;
    getItemEndpoint(apiUrl: string, collection: string, id?: string): string;
    getCollectionEndpoint(apiUrl: string, collection: string, options?: {
        filter?: any;
        sort?: any;
        limit?: number;
    }): string;
    private mapCollectionToWpRoute;
    fetchCollection(collection: string, options?: {
        filter?: any;
        sort?: any;
        limit?: number;
        credentials?: {
            apiUrl?: string;
            apiKey?: string;
            previewToken?: string;
        };
    }): Promise<any[]>;
    updateItem(collection: string, id: string, data: Record<string, any>, credentials?: {
        apiUrl?: string;
        apiKey?: string;
        headers?: Record<string, string>;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
//# sourceMappingURL=wordpress.d.ts.map