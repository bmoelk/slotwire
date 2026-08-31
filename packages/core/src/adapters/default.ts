import type { CmsDeepLinkOptions } from '../types.js';
import { BaseCmsAdapter } from './base.js';

export class DefaultAdapter extends BaseCmsAdapter {
  readonly provider = 'default';

  buildAdminLink(options: CmsDeepLinkOptions): string {
    const {
      adminUrl = 'https://cms.example.com/admin',
      collection = '',
      documentId,
      pageSlug,
      sectionKey,
      action = documentId ? 'edit' : 'create',
    } = options;

    const base = this.cleanBaseUrl(adminUrl);
    const queryStr = this.buildQueryParams(pageSlug, sectionKey);

    if (action === 'edit' && documentId) {
      return `${base}/edit/${encodeURIComponent(documentId)}${queryStr}`;
    }
    if (collection) {
      return `${base}/${encodeURIComponent(collection)}/new${queryStr}`;
    }
    return base;
  }
}
