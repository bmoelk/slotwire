import type { CmsDeepLinkOptions } from '../types.js';
import { BaseCmsAdapter } from './base.js';

export class StrapiAdapter extends BaseCmsAdapter {
  readonly provider = 'strapi';

  buildAdminLink(options: CmsDeepLinkOptions): string {
    const {
      adminUrl = 'https://strapi.example.com/admin',
      collection = '',
      documentId,
      pageSlug,
      sectionKey,
      action = documentId ? 'edit' : 'create',
    } = options;

    const base = this.cleanBaseUrl(adminUrl);
    const queryStr = this.buildQueryParams(pageSlug, sectionKey);

    if (action === 'edit' && documentId && collection) {
      return `${base}/content-manager/collectionType/api::${encodeURIComponent(collection)}.${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}${queryStr}`;
    }

    if (action === 'create' && collection) {
      return `${base}/content-manager/collectionType/api::${encodeURIComponent(collection)}.${encodeURIComponent(collection)}/create${queryStr}`;
    }

    if (collection) {
      return `${base}/content-manager/collectionType/api::${encodeURIComponent(collection)}.${encodeURIComponent(collection)}${queryStr}`;
    }

    return `${base}/content-manager`;
  }
}
