import type { CmsDeepLinkOptions } from '../types.js';
import type { SlotWireCmsAdapter } from './types.js';
export * from './types.js';
export * from './base.js';
export * from './sonicjs.js';
export * from './git.js';
export * from './strapi.js';
export * from './payload.js';
export * from './directus.js';
export * from './wordpress.js';
export * from './default.js';
export declare function registerCmsAdapter(adapter: SlotWireCmsAdapter): void;
export declare function getCmsAdapter(provider?: string): SlotWireCmsAdapter;
export declare function buildCmsDeepLink(options: CmsDeepLinkOptions): string;
//# sourceMappingURL=index.d.ts.map