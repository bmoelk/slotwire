import type { CmsDeepLinkOptions } from '../types.js';
import { BaseCmsAdapter } from './base.js';

export abstract class BaseGitAdapter extends BaseCmsAdapter {
  protected resolveEntrySlug(documentId?: string, pageSlug?: string, sectionKey?: string): string {
    if (documentId) return documentId;
    if (pageSlug && sectionKey) return `${pageSlug}-${sectionKey}`;
    if (pageSlug) return pageSlug;
    if (sectionKey) return sectionKey;
    return 'index';
  }
}

/**
 * Keystatic Adapter (TypeScript / Markdown / MDX Git CMS)
 * Routes to /keystatic/collection/:collection[/item/:slug | /create]
 */
export class KeystaticAdapter extends BaseGitAdapter {
  readonly provider = 'keystatic';

  buildAdminLink(options: CmsDeepLinkOptions): string {
    const {
      adminUrl = '/keystatic',
      collection = '',
      documentId,
      pageSlug,
      sectionKey,
      action = documentId ? 'edit' : 'list',
      archetype,
    } = options;

    const base = this.cleanBaseUrl(adminUrl);
    const targetSlug = this.resolveEntrySlug(documentId, pageSlug, sectionKey);

    const isCollectionArchetype =
      archetype === 'cards' ||
      archetype === 'gallery' ||
      archetype === 'testimonials' ||
      archetype === 'endorsements' ||
      archetype === 'qa' ||
      archetype === 'faq' ||
      archetype === 'table' ||
      action === 'list';

    if (action === 'edit' && (documentId || !isCollectionArchetype)) {
      return `${base}/collection/${encodeURIComponent(collection)}/item/${encodeURIComponent(targetSlug)}`;
    }

    if (action === 'create') {
      return `${base}/collection/${encodeURIComponent(collection)}/create`;
    }

    if (collection) {
      return `${base}/collection/${encodeURIComponent(collection)}`;
    }

    return base;
  }
}

/**
 * Decap CMS & Sveltia CMS Adapter (Static Git SPA)
 * Routes to /admin/#/collections/:collection[/entries/:slug | /new]
 */
export class DecapAdapter extends BaseGitAdapter {
  readonly provider = 'decap';

  buildAdminLink(options: CmsDeepLinkOptions): string {
    const {
      adminUrl = '/admin',
      collection = '',
      documentId,
      pageSlug,
      sectionKey,
      action = documentId ? 'edit' : 'list',
      archetype,
    } = options;

    const base = this.cleanBaseUrl(adminUrl);
    const targetSlug = this.resolveEntrySlug(documentId, pageSlug, sectionKey);

    const isCollectionArchetype =
      archetype === 'cards' ||
      archetype === 'gallery' ||
      archetype === 'testimonials' ||
      archetype === 'endorsements' ||
      archetype === 'qa' ||
      archetype === 'faq' ||
      archetype === 'table' ||
      action === 'list';

    if (action === 'edit' && (documentId || !isCollectionArchetype)) {
      return `${base}/#/collections/${encodeURIComponent(collection)}/entries/${encodeURIComponent(targetSlug)}`;
    }

    if (action === 'create') {
      return `${base}/#/collections/${encodeURIComponent(collection)}/new`;
    }

    if (collection) {
      return `${base}/#/collections/${encodeURIComponent(collection)}`;
    }

    return `${base}/#`;
  }
}
