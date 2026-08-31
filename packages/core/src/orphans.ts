import type { SlotWireConfig, OrphanedContentReport, OrphanedContentItem } from './types.js';
import { resolvePreviewRoute } from './schema.js';

export async function scanOrphanedContent(
  config: SlotWireConfig,
  knownRoutes: string[] = []
): Promise<OrphanedContentReport> {
  const { apiUrl, apiKey } = config.cms;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const ghostDocuments: OrphanedContentItem[] = [];
  const danglingReferences: OrphanedContentItem[] = [];
  const deadMedia: OrphanedContentItem[] = [];
  let totalChecked = 0;

  try {
    // 1. Fetch all collections defined in slots
    const allPublishedDocs: Array<{ id: string; collection: string; slug: string; title: string; data: any }> = [];
    const referencedMediaKeys = new Set<string>();
    const referencedAuthorIds = new Set<string>();

    for (const [slotKey, slotDef] of Object.entries(config.slots)) {
      const collectionName = slotDef.kind === 'collection' ? slotDef.collectionName : slotKey;
      try {
        const res = await fetch(`${apiUrl}/api/collections/${collectionName}/content`, { headers });
        if (!res.ok) continue;
        const json: any = await res.json();
        const items = Array.isArray(json) ? json : json.data || (json.id ? [json] : []);

        for (const item of items) {
          totalChecked++;
          const docId = item.id || `${collectionName}-${item.slug || totalChecked}`;
          const docSlug = item.slug || item.id || '';
          let dataPayload = item.data || item;
          if (typeof dataPayload === 'string') {
            try {
              dataPayload = JSON.parse(dataPayload);
            } catch {}
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
          const mediaMatches = rawString.match(/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|svg|gif)/gi) || [];
          for (const m of mediaMatches) {
            referencedMediaKeys.add(m);
          }

          if (mergedDoc.author) {
            referencedAuthorIds.add(String(mergedDoc.author));
          }
        }
      } catch {
        // Skip un-queryable collections
      }
    }

    // 2. Check for Ghost Documents (Documents with no known route)
    if (knownRoutes.length > 0) {
      for (const doc of allPublishedDocs) {
        const expectedRoute = resolvePreviewRoute(config, doc.collection, doc.data);
        if (expectedRoute) {
          const routeClean = expectedRoute.split('#')[0].replace(/\/$/, '') || '/';
          const isReachable = knownRoutes.some(
            (r) => r.replace(/\/$/, '') === routeClean || r.startsWith(routeClean)
          );
          if (!isReachable) {
            ghostDocuments.push({
              id: doc.id,
              collection: doc.collection,
              title: doc.title,
              slug: doc.slug,
              reason: 'unreachable_route',
              details: `Published document resolves to route '${expectedRoute}' which is not in sitemap or active page routes.`,
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
        if (doc.collection === 'blog_post' && doc.data.author) {
          const authorRef = String(doc.data.author);
          if (!knownAuthorSlugs.has(authorRef)) {
            danglingReferences.push({
              id: doc.id,
              collection: doc.collection,
              title: doc.title,
              slug: doc.slug,
              reason: 'dangling_reference',
              details: `References author '${authorRef}', but no matching active author profile exists in CMS.`,
            });
          }
        }
      }
    }

    // 4. Check for Dead Media in CMS R2 library
    try {
      const mediaRes = await fetch(`${apiUrl}/api/collections/media_asset/content`, { headers });
      if (mediaRes.ok) {
        const mediaJson: any = await mediaRes.json();
        const mediaItems = Array.isArray(mediaJson) ? mediaJson : mediaJson.data || [];

        for (const item of mediaItems) {
          totalChecked++;
          const fileKey = item.r2Key || item.slug || item.title || item.name || '';
          const filename = item.filename || item.name || fileKey;
          if (fileKey && !referencedMediaKeys.has(fileKey) && !referencedMediaKeys.has(filename)) {
            deadMedia.push({
              id: item.id || fileKey,
              collection: 'media_asset',
              title: filename,
              slug: fileKey,
              reason: 'unreferenced_media',
              details: `Media file '${filename}' exists in R2 storage but is not referenced by any active content record.`,
            });
          }
        }
      }
    } catch {
      // Media collection check optional
    }
  } catch (err: any) {
    // Graceful error logging
  }

  return {
    timestamp: new Date().toISOString(),
    apiUrl,
    totalChecked,
    ghostDocuments,
    danglingReferences,
    deadMedia,
    isClean: ghostDocuments.length === 0 && danglingReferences.length === 0 && deadMedia.length === 0,
  };
}
