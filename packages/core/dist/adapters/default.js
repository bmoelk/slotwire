import { BaseCmsAdapter } from './base.js';
export class DefaultAdapter extends BaseCmsAdapter {
    provider = 'default';
    buildAdminLink(options) {
        const { adminUrl = 'https://cms.example.com/admin', collection = '', documentId, pageSlug, sectionKey, action = documentId ? 'edit' : 'create', } = options;
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
//# sourceMappingURL=default.js.map