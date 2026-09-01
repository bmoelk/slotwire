import type { CmsDeepLinkOptions } from '../types.js';
import type { SlotWireCmsAdapter } from './types.js';
import { SonicJsAdapter } from './sonicjs.js';
import { KeystaticAdapter, DecapAdapter } from './git.js';
import { StrapiAdapter } from './strapi.js';
import { PayloadAdapter } from './payload.js';
import { DirectusAdapter } from './directus.js';
import { DefaultAdapter } from './default.js';

export * from './types.js';
export * from './base.js';
export * from './sonicjs.js';
export * from './git.js';
export * from './strapi.js';
export * from './payload.js';
export * from './directus.js';
export * from './default.js';

const adapterRegistry = new Map<string, SlotWireCmsAdapter>([
  ['sonicjs', new SonicJsAdapter()],
  ['keystatic', new KeystaticAdapter()],
  ['decap', new DecapAdapter()],
  ['sveltia', new DecapAdapter()],
  ['strapi', new StrapiAdapter()],
  ['payload', new PayloadAdapter()],
  ['directus', new DirectusAdapter()],
  ['slottd', new DirectusAdapter()],
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
