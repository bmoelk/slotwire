import type { CmsDeepLinkOptions } from '../types.js';
import type { SlotWireCmsAdapter, DocumentContext } from './types.js';

export abstract class BaseCmsAdapter implements SlotWireCmsAdapter {
  abstract readonly provider: string;

  abstract buildAdminLink(options: CmsDeepLinkOptions): string;

  resolveDocumentContext?(context: unknown): DocumentContext;

  protected cleanBaseUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  protected buildQueryParams(pageSlug?: string, sectionKey?: string): string {
    const params = new URLSearchParams();
    if (pageSlug) params.set('pageSlug', pageSlug);
    if (sectionKey) params.set('sectionKey', sectionKey);
    return params.toString() ? `?${params.toString()}` : '';
  }
}
