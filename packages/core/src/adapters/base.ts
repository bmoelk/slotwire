import type { CmsDeepLinkOptions, ScaffoldBundle, ScaffoldResult } from '../types.js';
import type { SlotWireCmsAdapter, DocumentContext } from './types.js';

export abstract class BaseCmsAdapter implements SlotWireCmsAdapter {
  abstract readonly provider: string;

  abstract buildAdminLink(options: CmsDeepLinkOptions): string;

  resolveDocumentContext?(context: unknown): DocumentContext;

  protected cleanBaseUrl(url: string): string {
    return (url || '').replace(/\/+$/, '');
  }

  protected buildQueryParams(pageSlug?: string, sectionKey?: string): string {
    const params = new URLSearchParams();
    if (pageSlug) params.set('pageSlug', pageSlug);
    if (sectionKey) params.set('sectionKey', sectionKey);
    return params.toString() ? `?${params.toString()}` : '';
  }

  /**
   * Returns the item endpoint for creating, updating, or deleting single records.
   * Default implementation follows the Directus/SlottD /items/:collection standard.
   */
  getItemEndpoint(apiUrl: string, collection: string, id?: string): string {
    const base = this.cleanBaseUrl(apiUrl);
    return id ? `${base}/items/${encodeURIComponent(collection)}/${encodeURIComponent(id)}` : `${base}/items/${encodeURIComponent(collection)}`;
  }

  /**
   * Returns the collection query endpoint for reading multiple records.
   */
  getCollectionEndpoint(apiUrl: string, collection: string, options: { filter?: any; sort?: any; limit?: number } = {}): string {
    const base = this.cleanBaseUrl(apiUrl);
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.sort && Array.isArray(options.sort)) params.set('sort', options.sort.join(','));
    const query = params.toString() ? `?${params.toString()}` : '';
    return `${base}/items/${encodeURIComponent(collection)}${query}`;
  }

  /**
   * Universal CMS-agnostic scaffolding engine with compensation rollback.
   */
  async scaffoldBundle(bundle: ScaffoldBundle, credentials: { apiUrl?: string; apiKey?: string } = {}): Promise<ScaffoldResult> {
    const apiUrl = this.cleanBaseUrl(credentials.apiUrl || '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (credentials.apiKey) {
      headers['Authorization'] = `Bearer ${credentials.apiKey}`;
    }

    const createdRecords: Array<{ collection: string; id?: string; slug?: string }> = [];

    for (const record of bundle.records) {
      try {
        const endpoint = this.getItemEndpoint(apiUrl, record.collection);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(record.data),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`Failed to create item in '${record.collection}' (${res.status}): ${errText}`);
        }

        const json: any = await res.json().catch(() => ({}));
        const recordId = json?.data?.id || json?.id || record.data.slug || record.data.id;
        createdRecords.push({
          collection: record.collection,
          id: recordId ? String(recordId) : undefined,
          slug: record.data.slug,
        });
      } catch (err: any) {
        // Rollback any records created during this bundle execution
        await this.rollbackRecords(apiUrl, headers, createdRecords);
        return {
          success: false,
          status: 'error',
          targetSlug: bundle.slug,
          createdCount: 0,
          createdIds: [],
          errors: [err.message || 'Scaffolding failed'],
        };
      }
    }

    const createdIds = createdRecords.map((r) => r.id || r.slug || 'unknown');
    return {
      success: true,
      status: 'ok',
      targetSlug: bundle.slug,
      createdCount: createdRecords.length,
      createdIds,
      previewUrl: bundle.previewUrl || `/${bundle.slug}?slotwire_preview=true`,
      targetUrl: bundle.previewUrl || `/${bundle.slug}?slotwire_preview=true`,
    };
  }

  /**
   * Compensating transactions: attempts to clean up created items if a bundle fails.
   */
  protected async rollbackRecords(apiUrl: string, headers: Record<string, string>, createdRecords: Array<{ collection: string; id?: string }>): Promise<void> {
    for (const rec of createdRecords.reverse()) {
      if (!rec.id) continue;
      try {
        const deleteUrl = this.getItemEndpoint(apiUrl, rec.collection, rec.id);
        await fetch(deleteUrl, { method: 'DELETE', headers }).catch(() => {});
      } catch {
        // Best-effort rollback
      }
    }
  }

  /**
   * Universal collection fetcher for loaders and schema validators.
   */
  async fetchCollection(collection: string, options: { filter?: any; sort?: any; limit?: number; credentials?: { apiUrl?: string; apiKey?: string } } = {}): Promise<any[]> {
    const apiUrl = this.cleanBaseUrl(options.credentials?.apiUrl || '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.credentials?.apiKey) {
      headers['Authorization'] = `Bearer ${options.credentials.apiKey}`;
    }

    const endpoint = this.getCollectionEndpoint(apiUrl, collection, options);
    const res = await fetch(endpoint, { headers });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`[SlotWire] Failed to fetch collection '${collection}' (${res.status}): ${err}`);
    }

    const json: any = await res.json();
    return Array.isArray(json) ? json : json.data || [];
  }
}
