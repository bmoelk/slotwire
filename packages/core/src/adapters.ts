import type { CmsDeepLinkOptions } from './types.js';

export interface SlotWireCmsAdapter {
  readonly provider: string;
  buildAdminLink(context: CmsDeepLinkOptions): string;
  resolveDocumentContext?(context: unknown): {
    collection: string;
    documentId: string;
    slug: string;
    status: 'draft' | 'published';
    data: Record<string, unknown>;
  };
}

export class SonicJsAdapter implements SlotWireCmsAdapter {
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

    const base = adminUrl.replace(/\/+$/, '');
    const params = new URLSearchParams();

    if (pageSlug) params.set('pageSlug', pageSlug);
    if (sectionKey) params.set('sectionKey', sectionKey);
    const queryStr = params.toString() ? `?${params.toString()}` : '';

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
      const extraParams = params.toString() ? `&${params.toString()}` : '';
      return `${base}/content/new?collection=${encodeURIComponent(collection)}${extraParams}`;
    }

    if (collection) {
      return `${base}/content?model=${encodeURIComponent(collection)}`;
    }

    return `${base}/content`;
  }
}



export class StrapiAdapter implements SlotWireCmsAdapter {
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

    const base = adminUrl.replace(/\/+$/, '');
    const params = new URLSearchParams();

    if (pageSlug) params.set('pageSlug', pageSlug);
    if (sectionKey) params.set('sectionKey', sectionKey);
    const queryStr = params.toString() ? `?${params.toString()}` : '';

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

export class PayloadAdapter implements SlotWireCmsAdapter {
  readonly provider = 'payload';

  buildAdminLink(options: CmsDeepLinkOptions): string {
    const {
      adminUrl = 'https://payload.example.com/admin',
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
    const queryStr = params.toString() ? `?${params.toString()}` : '';

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

export class DefaultAdapter implements SlotWireCmsAdapter {
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

    const base = adminUrl.replace(/\/+$/, '');
    const params = new URLSearchParams();

    if (pageSlug) params.set('pageSlug', pageSlug);
    if (sectionKey) params.set('sectionKey', sectionKey);
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

const adapterRegistry = new Map<string, SlotWireCmsAdapter>([
  ['sonicjs', new SonicJsAdapter()],
  ['strapi', new StrapiAdapter()],
  ['payload', new PayloadAdapter()],
  ['default', new DefaultAdapter()],
]);

export function registerCmsAdapter(adapter: SlotWireCmsAdapter): void {
  adapterRegistry.set(adapter.provider.toLowerCase(), adapter);
}

export function getCmsAdapter(provider = 'sonicjs'): SlotWireCmsAdapter {
  const normalized = (provider || 'sonicjs').toLowerCase();
  return adapterRegistry.get(normalized) || adapterRegistry.get('default')!;
}

export function buildCmsDeepLink(options: CmsDeepLinkOptions): string {
  const adapter = getCmsAdapter(options.provider);
  return adapter.buildAdminLink(options);
}
