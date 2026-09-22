import type { CmsDeepLinkOptions } from '../types.js';
import { BaseCmsAdapter } from './base.js';
/**
 * Directus Adapter (Open Source Data Engine on SQL)
 * Routes to /admin/content/:collection[/:id | /+]
 */
export declare class DirectusAdapter extends BaseCmsAdapter {
    readonly provider = "directus";
    buildAdminLink(options: CmsDeepLinkOptions): string;
}
//# sourceMappingURL=directus.d.ts.map