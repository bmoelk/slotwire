import type { SlotWireConfig } from '@slotwire/core';

export class SlotWireClient {
  private config: SlotWireConfig;

  constructor(config: SlotWireConfig) {
    this.config = config;
  }

  async getCollection<T = any>(collectionName: string): Promise<T[]> {
    try {
      const url = `${this.config.cms.apiUrl}/api/collections/${collectionName}/content`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn(`[SlotWire Client] Failed to fetch collection '${collectionName}':`, e);
      return [];
    }
  }

  async getSection<T = any>(sectionSlug: string): Promise<T | null> {
    try {
      const url = `${this.config.cms.apiUrl}/api/collections/homepage_sections/content?filter[slug][equals]=${sectionSlug}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0]?.data || json.data?.[0] || null;
    } catch (e) {
      console.warn(`[SlotWire Client] Failed to fetch section '${sectionSlug}':`, e);
      return null;
    }
  }
}

export function createSlotWireClient(config: SlotWireConfig) {
  return new SlotWireClient(config);
}
