import type {
  ContractValidationReport,
  SlotValidationResult,
  SlotWireConfig,
} from './types.js';

export async function validateContract(
  config: SlotWireConfig,
  fetchFn: typeof fetch = fetch
): Promise<ContractValidationReport> {
  const results: SlotValidationResult[] = [];
  const { apiUrl } = config.cms;

  for (const [slotKey, slotDef] of Object.entries(config.slots)) {
    const totalFields = Object.keys(slotDef.properties).length;

    try {
      let endpoint = '';
      if (slotDef.kind === 'collection') {
        endpoint = `${apiUrl}/api/collections/${slotDef.collectionName}/content`;
      } else {
        const targetCollection = (slotDef as any).collectionName || slotKey;
        // First try dedicated collection, or fallback to homepage_sections with slug filter
        if (targetCollection === 'hero') {
          endpoint = `${apiUrl}/api/collections/homepage_sections/content?filter[slug][equals]=hero`;
        } else {
          endpoint = `${apiUrl}/api/collections/${targetCollection}/content`;
        }
      }

      const res = await fetchFn(endpoint);
      if (!res.ok) {
        results.push({
          slotKey,
          kind: slotDef.kind,
          status: 'missing',
          totalFields,
          populatedFields: 0,
          errors: [
            {
              field: '_root',
              message: `HTTP ${res.status} fetching ${endpoint}`,
            },
          ],
        });
        continue;
      }

      const json = await res.json();
      const rawData = json.data;

      if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
        results.push({
          slotKey,
          kind: slotDef.kind,
          status: 'missing',
          totalFields,
          populatedFields: 0,
          errors: [
            {
              field: '_root',
              message: `No content documents returned from CMS for slot '${slotKey}'`,
            },
          ],
        });
        continue;
      }

      // Check fields of first item or single document
      const sampleItem = Array.isArray(rawData) ? rawData[0]?.data || rawData[0] : rawData.data || rawData;
      let populated = 0;
      const errors: Array<{ field: string; message: string }> = [];

      for (const [fieldKey, fieldDef] of Object.entries(slotDef.properties)) {
        const val = sampleItem?.[fieldKey];
        if (val !== undefined && val !== null && val !== '') {
          populated++;
        } else if (fieldDef.required) {
          errors.push({
            field: fieldKey,
            message: `Required field '${fieldKey}' is unpopulated or missing in CMS document.`,
          });
        }
      }

      const status =
        errors.length === 0
          ? 'valid'
          : populated > 0
          ? 'partial'
          : 'missing';

      results.push({
        slotKey,
        kind: slotDef.kind,
        status,
        totalFields,
        populatedFields: populated,
        errors,
        payloadCount: Array.isArray(rawData) ? rawData.length : 1,
      });
    } catch (err: any) {
      results.push({
        slotKey,
        kind: slotDef.kind,
        status: 'missing',
        totalFields,
        populatedFields: 0,
        errors: [{ field: '_root', message: err?.message || 'Network error' }],
      });
    }
  }

  const validSlots = results.filter((r) => r.status === 'valid').length;
  const partialSlots = results.filter((r) => r.status === 'partial').length;
  const missingSlots = results.filter((r) => r.status === 'missing').length;

  return {
    timestamp: new Date().toISOString(),
    apiUrl,
    totalSlots: results.length,
    validSlots,
    partialSlots,
    missingSlots,
    results,
    isFullyCovered: validSlots === results.length && results.length > 0,
  };
}
