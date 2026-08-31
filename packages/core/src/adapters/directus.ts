import type { CmsDeepLinkOptions } from '../types.js';
import { BaseCmsAdapter } from './base.js';

/**
 * Directus Adapter (Open Source Data Engine on SQL)
 * Routes to /admin/content/:collection[/:id | /+]
 */
export class DirectusAdapter extends BaseCmsAdapter {
  readonly provider = 'directus';

  buildAdminLink(options: CmsDeepLinkOptions): string {
    const {
      adminUrl = 'https://directus.example.com/admin',
      collection = '',
      documentId,
      pageSlug,
      sectionKey,
      action = documentId ? 'edit' : 'create',
      archetype,
    } = options;

    const base = this.cleanBaseUrl(adminUrl);
    const queryStr = this.buildQueryParams(pageSlug, sectionKey);

    const isCollectionArchetype =
      archetype === 'cards' ||
      archetype === 'gallery' ||
      archetype === 'testimonials' ||
      archetype === 'endorsements' ||
      archetype === 'qa' ||
      archetype === 'faq' ||
      archetype === 'table' ||
      action === 'list';

    // 1. Single Document Edit
    if (action === 'edit' && documentId && collection) {
      return `${base}/content/${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}${queryStr}`;
    }

    // 2. Collection Model List View
    if (collection && isCollectionArchetype) {
      return `${base}/content/${encodeURIComponent(collection)}`;
    }

    // 3. New Record Creation (Directus uses /+ for new item)
    if (action === 'create' && collection) {
      return `${base}/content/${encodeURIComponent(collection)}/+${queryStr}`;
    }

    if (collection) {
      return `${base}/content/${encodeURIComponent(collection)}`;
    }

    return `${base}/content`;
  }
}
