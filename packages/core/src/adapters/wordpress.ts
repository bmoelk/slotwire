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
}
