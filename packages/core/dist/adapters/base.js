export class BaseCmsAdapter {
    getAuthLoginUrl(apiUrl, returnOrigin) {
        const base = this.cleanBaseUrl(apiUrl);
        return `${base}/admin/login?slotwire_auth=1&origin=${encodeURIComponent(returnOrigin)}`;
    }
    getAuthMeUrl(apiUrl) {
        const base = this.cleanBaseUrl(apiUrl);
        return `${base}/ext/auth/me`;
    }
    cleanBaseUrl(url) {
        return (url || '').replace(/\/+$/, '');
    }
    buildQueryParams(pageSlug, sectionKey) {
        const params = new URLSearchParams();
        if (pageSlug)
            params.set('pageSlug', pageSlug);
        if (sectionKey)
            params.set('sectionKey', sectionKey);
        return params.toString() ? `?${params.toString()}` : '';
    }
    /**
     * Returns the item endpoint for creating, updating, or deleting single records.
     * Default implementation follows the Directus/SlottD /items/:collection standard.
     */
    getItemEndpoint(apiUrl, collection, id) {
        const base = this.cleanBaseUrl(apiUrl);
        return id ? `${base}/items/${encodeURIComponent(collection)}/${encodeURIComponent(id)}` : `${base}/items/${encodeURIComponent(collection)}`;
    }
    /**
     * Returns the collection query endpoint for reading multiple records.
     */
    getCollectionEndpoint(apiUrl, collection, options = {}) {
        const base = this.cleanBaseUrl(apiUrl);
        const params = new URLSearchParams();
        if (options.limit)
            params.set('limit', String(options.limit));
        if (options.sort && Array.isArray(options.sort))
            params.set('sort', options.sort.join(','));
        const query = params.toString() ? `?${params.toString()}` : '';
        return `${base}/items/${encodeURIComponent(collection)}${query}`;
    }
    /**
     * Universal CMS-agnostic scaffolding engine with compensation rollback.
     */
    async scaffoldBundle(bundle, credentials = {}) {
        const apiUrl = this.cleanBaseUrl(credentials.apiUrl || '');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (credentials.apiKey) {
            headers['Authorization'] = `Bearer ${credentials.apiKey}`;
        }
        const createdRecords = [];
        for (const record of bundle.records) {
            try {
                const endpoint = this.getItemEndpoint(apiUrl, record.collection);
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(record.data),
                });
                if (!res.ok) {
                    const errText = await res.text().catch(() => '');
                    throw new Error(`Failed to create item in '${record.collection}' (${res.status}): ${errText}`);
                }
                const json = await res.json().catch(() => ({}));
                const recordId = json?.data?.id || json?.id || record.data.slug || record.data.id;
                createdRecords.push({
                    collection: record.collection,
                    id: recordId ? String(recordId) : undefined,
                    slug: record.data.slug,
                });
            }
            catch (err) {
                // Rollback any records created during this bundle execution
                await this.rollbackRecords(apiUrl, headers, createdRecords);
                return {
                    success: false,
                    status: 'error',
                    targetSlug: bundle.slug,
                    createdCount: 0,
                    createdIds: [],
                    errors: [err.message || 'Scaffolding failed'],
                };
            }
        }
        const createdIds = createdRecords.map((r) => r.id || r.slug || 'unknown');
        return {
            success: true,
            status: 'ok',
            targetSlug: bundle.slug,
            createdCount: createdRecords.length,
            createdIds,
            previewUrl: bundle.previewUrl || `/${bundle.slug}?slotwire_preview=true`,
            targetUrl: bundle.previewUrl || `/${bundle.slug}?slotwire_preview=true`,
        };
    }
    /**
     * Compensating transactions: attempts to clean up created items if a bundle fails.
     */
    async rollbackRecords(apiUrl, headers, createdRecords) {
        for (const rec of createdRecords.reverse()) {
            if (!rec.id)
                continue;
            try {
                const deleteUrl = this.getItemEndpoint(apiUrl, rec.collection, rec.id);
                await fetch(deleteUrl, { method: 'DELETE', headers }).catch(() => { });
            }
            catch {
                // Best-effort rollback
            }
        }
    }
    /**
     * Universal collection fetcher for loaders and schema validators.
     */
    async fetchCollection(collection, options = {}) {
        const apiUrl = this.cleanBaseUrl(options.credentials?.apiUrl || '');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (options.credentials?.apiKey) {
            headers['Authorization'] = `Bearer ${options.credentials.apiKey}`;
        }
        const endpoint = this.getCollectionEndpoint(apiUrl, collection, options);
        const res = await fetch(endpoint, { headers });
        if (!res.ok) {
            const err = await res.text().catch(() => '');
            throw new Error(`[SlotWire] Failed to fetch collection '${collection}' (${res.status}): ${err}`);
        }
        const json = await res.json();
        return Array.isArray(json) ? json : json.data || [];
    }
    /**
     * Universal item updater using standard Directus/SlottD REST PATCH.
     */
    async updateItem(collection, id, data, credentials) {
        const apiUrl = this.cleanBaseUrl(credentials?.apiUrl || '');
        const headers = {
            'Content-Type': 'application/json',
            ...(credentials?.headers || {}),
        };
        if (credentials?.apiKey && !headers['Authorization'] && !headers['authorization']) {
            headers['Authorization'] = `Bearer ${credentials.apiKey}`;
        }
        const endpoint = this.getItemEndpoint(apiUrl, collection, id);
        try {
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                return {
                    success: false,
                    error: `Failed to update '${collection}/${id}' (${res.status}): ${errText}`,
                };
            }
            const json = await res.json().catch(() => ({}));
            return {
                success: true,
                data: json.data || json,
            };
        }
        catch (err) {
            return {
                success: false,
                error: err.message || 'Network error during update',
            };
        }
    }
}
//# sourceMappingURL=base.js.map