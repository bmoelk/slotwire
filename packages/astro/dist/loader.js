import { getCmsAdapter, getSlotEntryZodSchema, resolveSlotTransformer } from '@slotwire/core';
/**
 * Universal Astro 5 Content Layer Loader for SlotWire.
 * Connects directly to any configured headless CMS (Directus, SlottD, WordPress, SonicJS)
 * and automatically infers schema validation from slotwire.config.ts.
 */
export function slotwireLoader(options) {
    const collection = options.collection;
    return {
        name: `slotwire-loader-${collection}`,
        schema: options.config
            ? () => getSlotEntryZodSchema(options.config, collection)
            : undefined,
        async load(context) {
            const { store, logger, parseData } = context;
            const provider = options.config?.cms?.provider ||
                (typeof process !== 'undefined' && (process.env?.CMS_PROVIDER || process.env?.PUBLIC_CMS_PROVIDER)) ||
                'directus';
            const apiUrl = options.config?.cms?.apiUrl ||
                (typeof process !== 'undefined' && (process.env?.CMS_API_URL || process.env?.PUBLIC_CMS_API_URL)) ||
                'http://localhost:8055';
            const apiKey = options.config?.cms?.apiKey ||
                (typeof process !== 'undefined' && (process.env?.CMS_API_KEY || process.env?.SLOTTD_ADMIN_API_KEY || process.env?.DIRECTUS_TOKEN)) ||
                undefined;
            const adapter = getCmsAdapter(provider);
            logger?.info?.(`[SlotWire] Loading collection '${collection}' from ${provider} (${apiUrl})...`);
            if (!adapter.fetchCollection || typeof adapter.fetchCollection !== 'function') {
                throw new Error(`[SlotWire] CMS adapter for provider '${provider}' does not implement fetchCollection().`);
            }
            try {
                const rawItems = await adapter.fetchCollection(collection, {
                    filter: options.filter,
                    sort: options.sort,
                    limit: options.limit,
                    credentials: { apiUrl, apiKey },
                });
                if (!Array.isArray(rawItems)) {
                    logger?.warn?.(`[SlotWire] Collection '${collection}' returned non-array response.`);
                    return;
                }
                const slotTransformer = resolveSlotTransformer(options.config, collection, { provider, collection });
                for (let item of rawItems) {
                    if (slotTransformer && typeof slotTransformer === 'function') {
                        item = slotTransformer(item, { slotKey: collection, collection, provider });
                    }
                    if (options.transform && typeof options.transform === 'function') {
                        item = options.transform(item);
                    }
                    const id = String(item.slug || item.id || item._id || item.key);
                    if (!id) {
                        logger?.warn?.(`[SlotWire] Skipping item in '${collection}' missing slug/id.`);
                        continue;
                    }
                    let validatedData = item;
                    if (parseData && typeof parseData === 'function') {
                        validatedData = await parseData({ id, data: item });
                    }
                    store.set({
                        id,
                        data: validatedData,
                    });
                }
                logger?.info?.(`[SlotWire] Loaded ${rawItems.length} items for collection '${collection}'.`);
            }
            catch (err) {
                logger?.error?.(`[SlotWire] Failed to load collection '${collection}': ${err.message}`);
                throw err;
            }
        },
    };
}
//# sourceMappingURL=loader.js.map