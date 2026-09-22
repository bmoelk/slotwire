export async function validateContract(config, fetchFn = fetch, options = { verifyMedia: true }) {
    const results = [];
    const allMissingMedia = [];
    const allRecommendations = [];
    const { apiUrl } = config.cms;
    const verifiedMediaPaths = new Map();
    async function checkMediaReachable(mediaPath) {
        if (!mediaPath || typeof mediaPath !== 'string')
            return true;
        if (verifiedMediaPaths.has(mediaPath)) {
            return verifiedMediaPaths.get(mediaPath);
        }
        try {
            if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
                const headRes = await fetchFn(mediaPath, { method: 'HEAD', signal: AbortSignal.timeout(2500) }).catch(() => null);
                const reachable = headRes ? headRes.ok || headRes.status === 304 : false;
                verifiedMediaPaths.set(mediaPath, reachable);
                return reachable;
            }
            // Relative path or descriptive R2 key
            const cleanKey = mediaPath.replace(/^\/media\//, '').replace(/^\/+/, '');
            const isDirectus = config.cms.provider === 'directus' || config.cms.provider === 'slottd';
            if (isDirectus) {
                // Directus / SlottD: Try assets endpoint then files endpoint
                const assetRes = await fetchFn(`${apiUrl}/assets/${cleanKey}`, { method: 'HEAD', signal: AbortSignal.timeout(2500) }).catch(() => null);
                if (assetRes && (assetRes.ok || assetRes.status === 304)) {
                    verifiedMediaPaths.set(mediaPath, true);
                    return true;
                }
                const fileRes = await fetchFn(`${apiUrl}/files/${cleanKey}`, { method: 'HEAD', signal: AbortSignal.timeout(2500) }).catch(() => null);
                const reachable = fileRes ? fileRes.ok || fileRes.status === 304 : false;
                verifiedMediaPaths.set(mediaPath, reachable);
                return reachable;
            }
            else {
                const fileRes = await fetchFn(`${apiUrl}/api/files/${cleanKey}`, { method: 'HEAD', signal: AbortSignal.timeout(2500) }).catch(() => null);
                const reachable = fileRes ? fileRes.ok || fileRes.status === 304 : false;
                verifiedMediaPaths.set(mediaPath, reachable);
                return reachable;
            }
        }
        catch {
            verifiedMediaPaths.set(mediaPath, false);
            return false;
        }
    }
    for (const [slotKey, slotDef] of Object.entries(config.slots)) {
        const totalFields = Object.keys(slotDef.properties).length;
        try {
            const isDirectus = config.cms.provider === 'directus' || config.cms.provider === 'slottd';
            let endpoint = '';
            if (isDirectus) {
                if (slotDef.kind === 'collection') {
                    const col = slotDef.collectionName === 'blog_post' ? 'blog_posts' : slotDef.collectionName;
                    endpoint = `${apiUrl}/items/${col}`;
                }
                else {
                    const targetCollection = slotDef.collectionName || slotKey;
                    if (targetCollection === 'hero') {
                        endpoint = `${apiUrl}/items/homepage_sections?filter[slug][_eq]=hero`;
                    }
                    else {
                        endpoint = `${apiUrl}/items/${targetCollection}`;
                    }
                }
            }
            else {
                if (slotDef.kind === 'collection') {
                    endpoint = `${apiUrl}/api/collections/${slotDef.collectionName}/content`;
                }
                else {
                    const targetCollection = slotDef.collectionName || slotKey;
                    if (targetCollection === 'hero') {
                        endpoint = `${apiUrl}/api/collections/homepage_sections/content?filter[slug][equals]=hero`;
                    }
                    else {
                        endpoint = `${apiUrl}/api/collections/${targetCollection}/content`;
                    }
                }
            }
            const res = await fetchFn(endpoint, { signal: AbortSignal.timeout(3000) });
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
            const errors = [];
            const warnings = [];
            const slotMissingMedia = [];
            for (const [fieldKey, fieldDef] of Object.entries(slotDef.properties)) {
                const val = sampleItem?.[fieldKey];
                if (val !== undefined && val !== null && val !== '') {
                    populated++;
                }
                else if (fieldDef.required) {
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
                        const isMediaField = fieldDef.type === 'media' ||
                            Boolean(fieldDef.mediaOptions) ||
                            /imageUrl|photoUrl|avatar|image|media/i.test(fieldKey);
                        const mediaVal = item?.[fieldKey];
                        if (isMediaField && mediaVal && typeof mediaVal === 'string' && fieldDef.mediaOptions?.checkExists !== false) {
                            const reachable = await checkMediaReachable(mediaVal);
                            if (!reachable) {
                                const docId = item.id || item.slug || 'unknown';
                                const missingItem = {
                                    slotKey,
                                    collection: slotDef.collectionName || slotKey,
                                    documentId: String(docId),
                                    documentTitle: item.title || item.name || item.slug,
                                    documentSlug: item.slug,
                                    field: fieldKey,
                                    mediaPath: mediaVal,
                                    recommendation: fieldDef.mediaOptions?.recommendation ||
                                        `Upload '${mediaVal.replace(/^\/media\//, '')}' to CMS media library or update '${fieldKey}' in ${slotKey}/${item.slug || docId}.`,
                                };
                                slotMissingMedia.push(missingItem);
                                allMissingMedia.push(missingItem);
                                allRecommendations.push(missingItem.recommendation);
                                warnings.push({
                                    field: fieldKey,
                                    message: `Referenced media '${mediaVal}' could not be verified in storage (document: ${item.slug || docId}).`,
                                });
                            }
                        }
                    }
                }
            }
            const status = errors.length === 0
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
        }
        catch (err) {
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
//# sourceMappingURL=validator.js.map