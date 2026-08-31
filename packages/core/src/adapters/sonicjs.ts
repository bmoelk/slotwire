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
      archetype,
    } = options;

    const isCollectionArchetype =
      archetype === 'cards' ||
      archetype === 'gallery' ||
      archetype === 'testimonials' ||
      archetype === 'endorsements' ||
      archetype === 'qa' ||
      archetype === 'faq' ||
      archetype === 'table';

    const action = options.action || (documentId ? 'edit' : isCollectionArchetype ? 'list' : 'create');

    const base = this.cleanBaseUrl(adminUrl);
    const queryStr = this.buildQueryParams(pageSlug, sectionKey);

    // 1. Single Document Direct Edit
    if (action === 'edit' && documentId) {
      return `${base}/content/${encodeURIComponent(documentId)}/edit${queryStr}`;
    }

    // 2. New Document Creation
    if (action === 'create' && collection) {
      const extraParams = queryStr ? `&${queryStr.slice(1)}` : '';
      return `${base}/content/new?collection=${encodeURIComponent(collection)}${extraParams}`;
    }

    // 3. Collection Archetypes or explicit list action
    if (collection && (action === 'list' || isCollectionArchetype)) {
      return `${base}/content?model=${encodeURIComponent(collection)}`;
    }

    if (collection) {
      return `${base}/content?model=${encodeURIComponent(collection)}`;
    }

    return `${base}/content`;
  }
}
