import type { CmsDeepLinkOptions } from '../types.js';
import { BaseCmsAdapter } from './base.js';
export declare abstract class BaseGitAdapter extends BaseCmsAdapter {
    protected resolveEntrySlug(documentId?: string, pageSlug?: string, sectionKey?: string): string;
}
/**
 * Keystatic Adapter (TypeScript / Markdown / MDX Git CMS)
 * Routes to /keystatic/collection/:collection[/item/:slug | /create]
 */
export declare class KeystaticAdapter extends BaseGitAdapter {
    readonly provider = "keystatic";
    buildAdminLink(options: CmsDeepLinkOptions): string;
}
/**
 * Decap CMS & Sveltia CMS Adapter (Static Git SPA)
 * Routes to /admin/#/collections/:collection[/entries/:slug | /new]
 */
export declare class DecapAdapter extends BaseGitAdapter {
    readonly provider = "decap";
    buildAdminLink(options: CmsDeepLinkOptions): string;
}
//# sourceMappingURL=git.d.ts.map