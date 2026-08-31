import type { CmsDeepLinkOptions } from '../types.js';

export interface DocumentContext {
  collection: string;
  documentId: string;
  slug: string;
  status: 'draft' | 'published';
  data: Record<string, unknown>;
}

export interface SlotWireCmsAdapter {
  readonly provider: string;
  buildAdminLink(context: CmsDeepLinkOptions): string;
  resolveDocumentContext?(context: unknown): DocumentContext;
}
