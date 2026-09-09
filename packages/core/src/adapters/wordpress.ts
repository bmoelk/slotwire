import type { CmsDeepLinkOptions } from '../types.js';
import { BaseCmsAdapter } from './base.js';

export class WordPressAdapter extends BaseCmsAdapter {
  readonly provider = 'wordpress';

  buildAdminLink(options: CmsDeepLinkOptions): string {
    const {
      adminUrl = 'https://cms.example.com/wp-admin',
      collection = 'pages',
      documentId,
      archetype,
    } = options;

    const base = this.cleanBaseUrl(adminUrl);
    const wpAdminBase = base.endsWith('/wp-admin') ? base : `${base}/wp-admin`;

    // 1. Single Post / Page / Custom Post Type Edit
    if (documentId) {
      return `${wpAdminBase}/post.php?post=${encodeURIComponent(documentId)}&action=edit`;
    }

    // 2. New Record Creation
    if (options.action === 'create') {
      const postType = collection === 'pages' ? 'page' : collection === 'posts' ? 'post' : collection;
      return `${wpAdminBase}/post-new.php?post_type=${encodeURIComponent(postType)}`;
    }

    // 3. Navigation Menus
    if (collection === 'site_navigation' || archetype === 'navigation') {
      return `${wpAdminBase}/nav-menus.php`;
    }

    // 4. Collection List Views (Posts, Pages, or CPTs)
    if (collection === 'pages') {
      return `${wpAdminBase}/edit.php?post_type=page`;
    }
    if (collection === 'posts') {
      return `${wpAdminBase}/edit.php`;
    }

    return `${wpAdminBase}/edit.php?post_type=${encodeURIComponent(collection)}`;
  }

  getItemEndpoint(apiUrl: string, collection: string, id?: string): string {
    const base = this.cleanBaseUrl(apiUrl);
    const path = this.mapCollectionToWpRoute(collection);
    return id ? `${base}/wp-json/wp/v2/${path}/${encodeURIComponent(id)}` : `${base}/wp-json/wp/v2/${path}`;
  }

  getCollectionEndpoint(apiUrl: string, collection: string, options: { filter?: any; sort?: any; limit?: number } = {}): string {
    const base = this.cleanBaseUrl(apiUrl);
    const path = this.mapCollectionToWpRoute(collection);
    const params = new URLSearchParams();
    params.set('per_page', String(options.limit || 100));
    return `${base}/wp-json/wp/v2/${path}?${params.toString()}`;
  }

  private mapCollectionToWpRoute(collection: string): string {
    if (collection === 'pages') return 'pages';
    if (collection === 'posts' || collection === 'blog_posts' || collection === 'blog_post') return 'posts';
    if (collection === 'site_navigation') return 'menu-items';
    return collection;
  }

  async fetchCollection(collection: string, options: { filter?: any; sort?: any; limit?: number; credentials?: { apiUrl?: string; apiKey?: string } } = {}): Promise<any[]> {
    const apiUrl = this.cleanBaseUrl(options.credentials?.apiUrl || '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.credentials?.apiKey) {
      if (options.credentials.apiKey.includes(':')) {
        const encoded = Buffer.from(options.credentials.apiKey).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      } else {
        headers['Authorization'] = `Bearer ${options.credentials.apiKey}`;
      }
    }

    const path = this.mapCollectionToWpRoute(collection);
    const params = new URLSearchParams();
    params.set('per_page', String(options.limit || 100));

    // 1. Try dedicated high-performance SlotWire route if plugin is installed
    const slotwireEndpoint = `${apiUrl}/wp-json/slotwire/v1/content/${path}?${params.toString()}`;
    try {
      const res = await fetch(slotwireEndpoint, { headers });
      if (res.ok) {
        const json: any = await res.json();
        return Array.isArray(json) ? json : json.data || [];
      }
    } catch {
      // SlotWire plugin endpoint not available or network error, fall back to core REST
    }

    // 2. Fall back to standard WordPress core REST API
    const coreEndpoint = `${apiUrl}/wp-json/wp/v2/${path}?${params.toString()}`;
    const res = await fetch(coreEndpoint, { headers });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`[SlotWire] WordPress fetch failed for '${collection}' (${res.status}): ${err}`);
    }

    const json: any = await res.json();
    return Array.isArray(json) ? json : json.data || [];
  }

  async updateItem(
    collection: string,
    id: string,
    data: Record<string, any>,
    credentials?: { apiUrl?: string; apiKey?: string }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const apiUrl = this.cleanBaseUrl(credentials?.apiUrl || '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (credentials?.apiKey) {
      if (credentials.apiKey.includes(':')) {
        const encoded = Buffer.from(credentials.apiKey).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      } else {
        headers['Authorization'] = `Bearer ${credentials.apiKey}`;
      }
    }

    const endpoint = this.getItemEndpoint(apiUrl, collection, id);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return {
          success: false,
          error: `WordPress update failed for '${collection}/${id}' (${res.status}): ${errText}`,
        };
      }

      const json: any = await res.json().catch(() => ({}));
      return {
        success: true,
        data: json,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error during WordPress update',
      };
    }
  }
}
