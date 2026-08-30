import type { CmsDeepLinkOptions } from '@slotwire/core';

/**
 * Builds a canonical deep-link URL into a Headless CMS admin interface
 * pre-populated with composite foreign keys (pageSlug, sectionKey, collection).
 */
export function buildCmsDeepLink(options: CmsDeepLinkOptions): string {
  const {
    provider = 'sonicjs',
    adminUrl = 'https://cms.brainendeavor.com/admin',
    collection = '',
    documentId,
    pageSlug,
    sectionKey,
    action = documentId ? 'edit' : 'create',
  } = options;

  const base = adminUrl.replace(/\/+$/, '');
  const params = new URLSearchParams();

  if (pageSlug) params.set('pageSlug', pageSlug);
  if (sectionKey) params.set('sectionKey', sectionKey);

  switch (provider) {
    case 'sonicjs': {
      if (action === 'edit' && documentId) {
        return `${base}/content/documents/${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}?${params.toString()}`;
      }
      if (collection) {
        const queryStr = params.toString() ? `?${params.toString()}` : '';
        return `${base}/content/documents/${encodeURIComponent(collection)}/new${queryStr}`;
      }
      return `${base}/content`;
    }

    case 'strapi': {
      if (action === 'edit' && documentId && collection) {
        return `${base}/content-manager/collectionType/api::${encodeURIComponent(collection)}.${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}`;
      }
      if (collection) {
        return `${base}/content-manager/collectionType/api::${encodeURIComponent(collection)}.${encodeURIComponent(collection)}/create?${params.toString()}`;
      }
      return `${base}/content-manager`;
    }

    case 'payload': {
      if (action === 'edit' && documentId && collection) {
        return `${base}/collections/${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}`;
      }
      if (collection) {
        return `${base}/collections/${encodeURIComponent(collection)}/create?${params.toString()}`;
      }
      return `${base}/collections`;
    }

    default: {
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      if (action === 'edit' && documentId) {
        return `${base}/edit/${encodeURIComponent(documentId)}${queryStr}`;
      }
      if (collection) {
        return `${base}/${encodeURIComponent(collection)}/new${queryStr}`;
      }
      return base;
    }
  }
}
