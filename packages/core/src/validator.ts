import type {
  ContractValidationReport,
  SlotValidationResult,
  SlotWireConfig,
  MissingMediaItem,
} from './types.js';

export async function validateContract(
  config: SlotWireConfig,
  fetchFn: typeof fetch = fetch,
  options: { verifyMedia?: boolean } = { verifyMedia: true }
): Promise<ContractValidationReport> {
  const results: SlotValidationResult[] = [];
  const allMissingMedia: MissingMediaItem[] = [];
  const allRecommendations: string[] = [];
  const { apiUrl } = config.cms;
  const verifiedMediaPaths = new Map<string, boolean>();

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(config.cms.headers || {}),
  };
  if (config.cms.apiKey) {
    requestHeaders['Authorization'] = `Bearer ${config.cms.apiKey}`;
  }

  async function checkMediaReachable(mediaPath: string): Promise<boolean> {
    if (!mediaPath || typeof mediaPath !== 'string') return true;
    if (verifiedMediaPaths.has(mediaPath)) {
      return verifiedMediaPaths.get(mediaPath)!;
    }

    try {
      if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
        const headRes = await fetchFn(mediaPath, { method: 'HEAD', headers: requestHeaders, signal: AbortSignal.timeout(2500) } as any).catch(() => null);
        const reachable = headRes ? headRes.ok || headRes.status === 304 : false;
        verifiedMediaPaths.set(mediaPath, reachable);
        return reachable;
      }

      // Relative path or descriptive R2 key
      const cleanKey = mediaPath.replace(/^\/media\//, '').replace(/^\/+/, '');
      const isDirectus = config.cms.provider === 'directus' || config.cms.provider === 'slottd';

      if (isDirectus) {
        // Directus / SlottD: Try assets endpoint then files endpoint
        const assetRes = await fetchFn(`${apiUrl}/assets/${cleanKey}`, { method: 'HEAD', headers: requestHeaders, signal: AbortSignal.timeout(2500) } as any).catch(() => null);
        if (assetRes && (assetRes.ok || assetRes.status === 304)) {
          verifiedMediaPaths.set(mediaPath, true);
          return true;
        }
        const fileRes = await fetchFn(`${apiUrl}/files/${cleanKey}`, { method: 'HEAD', headers: requestHeaders, signal: AbortSignal.timeout(2500) } as any).catch(() => null);
        const reachable = fileRes ? fileRes.ok || fileRes.status === 304 : false;
        verifiedMediaPaths.set(mediaPath, reachable);
        return reachable;
      } else {
        const fileRes = await fetchFn(`${apiUrl}/api/files/${cleanKey}`, { method: 'HEAD', headers: requestHeaders, signal: AbortSignal.timeout(2500) } as any).catch(() => null);
        const reachable = fileRes ? fileRes.ok || fileRes.status === 304 : false;
        verifiedMediaPaths.set(mediaPath, reachable);
        return reachable;
      }
    } catch {
      verifiedMediaPaths.set(mediaPath, false);
      return false;
    }
  }

  for (const [slotKey, slotDef] of Object.entries(config.slots)) {
    const totalFields = Object.keys(slotDef.properties).length;

    try {
      const isDirectus = config.cms.provider === 'directus' || config.cms.provider === 'slottd';
      const siteId = config.cms.siteId || config.siteId;
      let endpoint = '';

      if (isDirectus) {
        let collectionPath = '';
        if (slotDef.kind === 'collection') {
          collectionPath = slotDef.collectionName === 'blog_post' ? 'blog_posts' : slotDef.collectionName;
        } else {
          const targetCollection = (slotDef as any).collectionName || slotKey;
          collectionPath = targetCollection === 'hero' ? 'homepage_sections' : targetCollection;
        }

        const url = new URL(`${apiUrl.replace(/\/+$/, '')}/items/${collectionPath}`);

        // Directus standard multi-site scoping
        if (siteId) {
          url.searchParams.set('filter[site_id][_eq]', siteId);
        }

        // Special singleton filter if applicable
        if (slotDef.kind !== 'collection' && ((slotDef as any).collectionName === 'hero' || slotKey === 'hero')) {
          url.searchParams.set('filter[slug][_eq]', 'hero');
        }

        // Optional custom query filters and params
        if (config.cms.params) {
          for (const [k, v] of Object.entries(config.cms.params)) {
            url.searchParams.set(k, v);
          }
        }
        if (config.cms.filter) {
          for (const [k, v] of Object.entries(config.cms.filter)) {
            url.searchParams.set(`filter[${k}][_eq]`, String(v));
          }
        }

        endpoint = url.toString();
      } else {
        let collectionPath = '';
        if (slotDef.kind === 'collection') {
          collectionPath = slotDef.collectionName;
        } else {
          const targetCollection = (slotDef as any).collectionName || slotKey;
          collectionPath = targetCollection === 'hero' ? 'homepage_sections' : targetCollection;
        }

        const url = new URL(`${apiUrl.replace(/\/+$/, '')}/api/collections/${collectionPath}/content`);
        if (slotDef.kind !== 'collection' && ((slotDef as any).collectionName === 'hero' || slotKey === 'hero')) {
          url.searchParams.set('filter[slug][equals]', 'hero');
        }
        endpoint = url.toString();
      }

      const res = await fetchFn(endpoint, {
        headers: requestHeaders,
        signal: AbortSignal.timeout(3000),
      } as any);
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

      const items = Array.isArray(rawData) ? rawData : [rawData];
      const sampleItem = items[0]?.data || items[0];
      let populated = 0;
      const errors: Array<{ field: string; message: string }> = [];
      const warnings: Array<{ field: string; message: string }> = [];
      const slotMissingMedia: MissingMediaItem[] = [];

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

      // Media Asset Reachability Checks across items
      if (options.verifyMedia !== false) {
        const itemsToCheck = items.slice(0, 30);
        for (const rawItem of itemsToCheck) {
          const item = rawItem?.data || rawItem;
          for (const [fieldKey, fieldDef] of Object.entries(slotDef.properties)) {
            const isMediaField =
              fieldDef.type === 'media' ||
              Boolean(fieldDef.mediaOptions) ||
              /imageUrl|photoUrl|avatar|image|media/i.test(fieldKey);

            const mediaVal = item?.[fieldKey];
            if (isMediaField && mediaVal && typeof mediaVal === 'string' && fieldDef.mediaOptions?.checkExists !== false) {
              const reachable = await checkMediaReachable(mediaVal);
              if (!reachable) {
                const docId = item.id || item.slug || 'unknown';
                const missingItem: MissingMediaItem = {
                  slotKey,
                  collection: (slotDef as any).collectionName || slotKey,
                  documentId: String(docId),
                  documentTitle: item.title || item.name || item.slug,
                  documentSlug: item.slug,
                  field: fieldKey,
                  mediaPath: mediaVal,
                  recommendation:
                    fieldDef.mediaOptions?.recommendation ||
                    `Upload '${mediaVal.replace(/^\/media\//, '')}' to CMS media library or update '${fieldKey}' in ${slotKey}/${item.slug || docId}.`,
                };
                slotMissingMedia.push(missingItem);
                allMissingMedia.push(missingItem);
                allRecommendations.push(missingItem.recommendation!);
                warnings.push({
                  field: fieldKey,
                  message: `Referenced media '${mediaVal}' could not be verified in storage (document: ${item.slug || docId}).`,
                });
              }
            }
          }
        }
      }

      const status =
        errors.length === 0
          ? slotMissingMedia.length > 0
            ? 'partial'
            : 'valid'
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
        warnings: warnings.length > 0 ? warnings : undefined,
        missingMedia: slotMissingMedia.length > 0 ? slotMissingMedia : undefined,
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
    missingMedia: allMissingMedia,
    fallbackSlots: [],
    recommendations: Array.from(new Set(allRecommendations)),
    isFullyCovered: validSlots === results.length && results.length > 0 && allMissingMedia.length === 0,
  };
}
