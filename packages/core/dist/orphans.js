import { resolvePreviewRoute } from './schema.js';
export async function scanOrphanedContent(config, knownRoutes = []) {
    const { apiUrl, apiKey } = config.cms;
    const isDirectus = config.cms.provider === 'directus' || config.cms.provider === 'slottd';
    const headers = {
        'Content-Type': 'application/json',
    };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }
    const ghostDocuments = [];
    const danglingReferences = [];
    const deadMedia = [];
    const missingMedia = [];
    const recommendations = [];
    let totalChecked = 0;
    try {
        // 1. Fetch all collections defined in slots
        const allPublishedDocs = [];
        const referencedMediaKeys = new Set();
        const referencedAuthorIds = new Set();
        for (const [slotKey, slotDef] of Object.entries(config.slots)) {
            const collectionName = slotDef.kind === 'collection' ? slotDef.collectionName : slotKey;
            try {
                const endpoint = isDirectus
                    ? `${apiUrl}/items/${collectionName}`
                    : `${apiUrl}/api/collections/${collectionName}/content`;
                const res = await fetch(endpoint, { headers, signal: AbortSignal.timeout(4000) });
                if (!res.ok)
                    continue;
                const json = await res.json();
                const items = Array.isArray(json) ? json : json.data || (json.id ? [json] : []);
                for (const item of items) {
                    totalChecked++;
                    const docId = item.id || `${collectionName}-${item.slug || totalChecked}`;
                    const docSlug = item.slug || item.id || '';
                    let dataPayload = item.data || item;
                    if (typeof dataPayload === 'string') {
                        try {
                            dataPayload = JSON.parse(dataPayload);
                        }
                        catch { }
                    }
                    const docTitle = item.title || item.name || item.authorName || (typeof dataPayload === 'object' && dataPayload ? (dataPayload.title || dataPayload.name || dataPayload.authorName) : '') || docSlug;
                    const mergedDoc = {
                        ...item,
                        ...(typeof dataPayload === 'object' && dataPayload ? dataPayload : {}),
                        slug: item.slug || dataPayload?.slug || docSlug,
                        title: docTitle,
                    };
                    allPublishedDocs.push({
                        id: docId,
                        collection: collectionName,
                        slug: docSlug,
                        title: docTitle,
                        data: mergedDoc,
                    });
                    // Inspect media / author references in payload
                    const rawString = JSON.stringify(mergedDoc);
                    const mediaMatches = rawString.match(/[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp|svg|gif|avif)/gi) || [];
                    for (const m of mediaMatches) {
                        const clean = m.replace(/^\/media\//, '').replace(/^\/+/, '');
                        referencedMediaKeys.add(clean);
                    }
                    if (mergedDoc.author) {
                        referencedAuthorIds.add(String(mergedDoc.author));
                    }
                }
            }
            catch {
                // Skip un-queryable collections
            }
        }
        // 2. Check for Ghost Documents (Documents with no known route)
        if (knownRoutes.length > 0) {
            for (const doc of allPublishedDocs) {
                const expectedRoute = resolvePreviewRoute(config, doc.collection, doc.data);
                if (expectedRoute) {
                    const routeClean = expectedRoute.split('#')[0].replace(/\/$/, '') || '/';
                    const isReachable = knownRoutes.some((r) => r.replace(/\/$/, '') === routeClean || r.startsWith(routeClean));
                    if (!isReachable) {
                        ghostDocuments.push({
                            id: doc.id,
                            collection: doc.collection,
                            title: doc.title,
                            slug: doc.slug,
                            reason: 'unreachable_route',
                            details: `Published document resolves to route '${expectedRoute}' which is not in sitemap or active page routes.`,
                            recommendation: `Create an Astro page route matching '${expectedRoute}' or adjust previewRoute pattern in slotwire.config.ts.`,
                        });
                    }
                }
            }
        }
        // 3. Check for Dangling Author References
        const authorSlot = config.slots['authors'];
        if (authorSlot) {
            const authorDocs = allPublishedDocs.filter((d) => d.collection === 'authors');
            const knownAuthorSlugs = new Set(authorDocs.map((a) => a.slug).concat(authorDocs.map((a) => a.id)));
            for (const doc of allPublishedDocs) {
                if ((doc.collection === 'blog_post' || doc.collection === 'blog_posts') && doc.data.author) {
                    const authorRef = String(doc.data.author);
                    if (!knownAuthorSlugs.has(authorRef)) {
                        danglingReferences.push({
                            id: doc.id,
                            collection: doc.collection,
                            title: doc.title,
                            slug: doc.slug,
                            reason: 'dangling_reference',
                            details: `References author '${authorRef}', but no matching active author profile exists in CMS.`,
                            recommendation: `Create author profile with slug '${authorRef}' in authors collection.`,
                        });
                    }
                }
            }
        }
        // 4. Check CMS Media Storage (Dead Media vs Missing Media)
        const existingMediaKeys = new Set();
        try {
            const mediaEndpoint = isDirectus
                ? `${apiUrl}/files?limit=-1`
                : `${apiUrl}/api/collections/media_asset/content`;
            const mediaRes = await fetch(mediaEndpoint, { headers, signal: AbortSignal.timeout(4000) });
            if (mediaRes.ok) {
                const mediaJson = await mediaRes.json();
                const mediaItems = Array.isArray(mediaJson) ? mediaJson : mediaJson.data || [];
                for (const item of mediaItems) {
                    totalChecked++;
                    const fileKey = item.key || item.r2Key || item.slug || item.title || item.name || '';
                    const filename = item.filename || item.name || fileKey;
                    const id = item.id ? String(item.id) : '';
                    if (fileKey)
                        existingMediaKeys.add(fileKey);
                    if (filename)
                        existingMediaKeys.add(filename);
                    if (id)
                        existingMediaKeys.add(id);
                    // Dead Media: In R2 storage but unreferenced
                    if (fileKey && !referencedMediaKeys.has(fileKey) && !referencedMediaKeys.has(filename)) {
                        deadMedia.push({
                            id: item.id || fileKey,
                            collection: 'media',
                            title: filename,
                            slug: fileKey,
                            reason: 'unreferenced_media',
                            details: `Media file '${filename}' exists in R2 storage but is not referenced by any active content record.`,
                            recommendation: `Archive or delete unreferenced media file '${filename}' if no longer needed.`,
                        });
                    }
                }
                // Missing Media: Referenced in content but missing from storage
                for (const refKey of referencedMediaKeys) {
                    if (!existingMediaKeys.has(refKey)) {
                        missingMedia.push({
                            id: refKey,
                            collection: 'media',
                            title: refKey,
                            slug: refKey,
                            reason: 'missing_media',
                            details: `Referenced media asset '${refKey}' is missing from R2 media storage.`,
                            recommendation: `Upload '${refKey}' in SlottD Media library or update referencing content records.`,
                        });
                        recommendations.push(`Upload missing asset '${refKey}' to R2 storage before releasing.`);
                    }
                }
            }
        }
        catch {
            // Media collection check optional
        }
        if (ghostDocuments.length > 0) {
            recommendations.push(`Review ${ghostDocuments.length} ghost document(s) that resolve to unreachable routes.`);
        }
        if (danglingReferences.length > 0) {
            recommendations.push(`Resolve ${danglingReferences.length} dangling author reference(s).`);
        }
    }
    catch (err) {
        // Graceful error logging
    }
    return {
        timestamp: new Date().toISOString(),
        apiUrl,
        totalChecked,
        ghostDocuments,
        danglingReferences,
        deadMedia,
        missingMedia,
        recommendations: Array.from(new Set(recommendations)),
        isClean: ghostDocuments.length === 0 && danglingReferences.length === 0 && missingMedia.length === 0,
    };
}
//# sourceMappingURL=orphans.js.map