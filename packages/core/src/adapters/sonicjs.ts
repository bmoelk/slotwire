import type { CmsDeepLinkOptions } from '../types.js';
import { BaseCmsAdapter } from './base.js';

export class SonicJsAdapter extends BaseCmsAdapter {
  readonly provider = 'sonicjs';

  buildAdminLink(options: CmsDeepLinkOptions): string {
    const {
      adminUrl = 'https://cms.brainendeavor.com/admin',
      collection = '',
      documentId,
      pageSlug,
      sectionKey,
      action = documentId ? 'edit' : 'create',
      archetype,
    } = options;

    const base = this.cleanBaseUrl(adminUrl);
    const queryStr = this.buildQueryParams(pageSlug, sectionKey);

    // 1. Single Document Direct Edit
    if (documentId) {
      return `${base}/content/${encodeURIComponent(documentId)}/edit${queryStr}`;
    }

    // 2. Collection Archetypes (cards, gallery, testimonials, etc.) or explicit list action
    const isCollectionArchetype =
      archetype === 'cards' ||
      archetype === 'gallery' ||
      archetype === 'testimonials' ||
      archetype === 'endorsements' ||
      archetype === 'qa' ||
      archetype === 'faq' ||
      archetype === 'table' ||
      action === 'list';

    if (collection && isCollectionArchetype) {
      return `${base}/content?model=${encodeURIComponent(collection)}`;
    }

    // 3. New Single Document Creation (for single-record sections/pages)
    if (action === 'create' && collection) {
      const extraParams = queryStr ? `&${queryStr.slice(1)}` : '';
      return `${base}/content/new?collection=${encodeURIComponent(collection)}${extraParams}`;
    }

    if (collection) {
      return `${base}/content?model=${encodeURIComponent(collection)}`;
    }

    return `${base}/content`;
  }
}
