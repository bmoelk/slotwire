import { BaseCmsAdapter } from './base.js';
export class PayloadAdapter extends BaseCmsAdapter {
    provider = 'payload';
    buildAdminLink(options) {
        const { adminUrl = 'https://payload.example.com/admin', collection = '', documentId, pageSlug, sectionKey, action = documentId ? 'edit' : 'create', } = options;
        const base = this.cleanBaseUrl(adminUrl);
        const queryStr = this.buildQueryParams(pageSlug, sectionKey);
        if (action === 'edit' && documentId && collection) {
            return `${base}/collections/${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}${queryStr}`;
        }
        if (action === 'create' && collection) {
            return `${base}/collections/${encodeURIComponent(collection)}/create${queryStr}`;
        }
        if (collection) {
            return `${base}/collections/${encodeURIComponent(collection)}${queryStr}`;
        }
        return `${base}/collections`;
    }
}
//# sourceMappingURL=payload.js.map