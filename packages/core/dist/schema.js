import { z } from 'zod';
import { generateBlueprint } from './blueprint.js';
class FieldBuilder {
    def = {
        required: true,
    };
    constructor(type, zodSchema) {
        this.def.type = type;
        this.def.zodSchema = zodSchema;
    }
    optional() {
        this.def.required = false;
        this.def.zodSchema = this.def.zodSchema?.optional();
        return this;
    }
    max(length) {
        this.def.maxLength = length;
        if (this.def.zodSchema instanceof z.ZodString) {
            this.def.zodSchema = this.def.zodSchema.max(length);
        }
        return this;
    }
    describe(desc) {
        this.def.description = desc;
        return this;
    }
    mediaOptions(opts) {
        this.def.mediaOptions = { ...(this.def.mediaOptions || {}), ...opts };
        return this;
    }
    image() {
        this.def.mediaOptions = {
            ...(this.def.mediaOptions || {}),
            allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'avif'],
        };
        return this;
    }
    or(other) {
        const otherZod = other instanceof FieldBuilder ? other.def.zodSchema : other;
        this.def.zodSchema = this.def.zodSchema?.or(otherZod);
        return this;
    }
    build() {
        return this.def;
    }
}
export const s = {
    string: () => new FieldBuilder('string', z.string()),
    textarea: () => new FieldBuilder('textarea', z.string()),
    number: () => new FieldBuilder('number', z.number()),
    boolean: () => new FieldBuilder('boolean', z.boolean()),
    slug: () => new FieldBuilder('slug', z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
    url: () => new FieldBuilder('url', z.string().url()),
    email: () => new FieldBuilder('email', z.string().email()),
    datetime: () => new FieldBuilder('datetime', z.string().or(z.date())),
    media: (options = {}) => {
        const builder = new FieldBuilder('media', z.string());
        builder.def.mediaOptions = {
            checkExists: true,
            ...options,
        };
        if (options.required === false) {
            builder.optional();
        }
        return builder;
    },
    image: (options = {}) => {
        return s.media({
            allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'avif'],
            ...options,
        });
    },
    richText: () => new FieldBuilder('richText', z.string().or(z.record(z.unknown()))),
    enum: (values) => {
        const builder = new FieldBuilder('enum', z.enum(values));
        builder.def.options = values;
        return builder;
    },
    reference: (targetCollection) => {
        const builder = new FieldBuilder('reference', z.string().or(z.record(z.unknown())));
        builder.def.refTarget = targetCollection;
        return builder;
    },
    array: (itemBuilder) => {
        const itemDef = itemBuilder.build();
        const builder = new FieldBuilder('array', z.array(itemDef.zodSchema));
        builder.def.items = itemDef;
        return builder;
    },
    nestedObject: (props) => {
        const properties = {};
        const shape = {};
        for (const [key, builder] of Object.entries(props)) {
            properties[key] = builder.build();
            shape[key] = properties[key].zodSchema;
        }
        const builder = new FieldBuilder('object', z.object(shape));
        builder.def.properties = properties;
        return builder;
    },
    object: (props, options = {}) => {
        const properties = {};
        const shape = {};
        for (const [key, builder] of Object.entries(props)) {
            properties[key] = builder.build();
            shape[key] = properties[key].zodSchema;
        }
        const def = {
            kind: 'object',
            properties,
            zodSchema: z.object(shape),
            previewRoute: undefined,
            transform: options.transform,
            editor: options.editor,
        };
        def.previewRoute = (route) => {
            def.previewRoutePattern = route;
            return def;
        };
        return def;
    },
    collection: (collectionName, props, options = {}) => {
        const properties = {};
        const shape = {};
        for (const [key, builder] of Object.entries(props)) {
            properties[key] = builder.build();
            shape[key] = properties[key].zodSchema;
        }
        const def = {
            kind: 'collection',
            collectionName,
            properties,
            zodSchema: z.array(z.object(shape)),
            previewRoute: undefined,
            transform: options.transform,
            editor: options.editor,
        };
        def.previewRoute = (route) => {
            def.previewRoutePattern = route;
            return def;
        };
        return def;
    },
    // Archetype Builders for Blueprint Resolution
    page: (options) => ({
        name: 'page',
        collection: options.collection || 'pages',
        template: options.template || 'standard',
        label: options.label,
        slots: options.slots,
        description: options.description || 'Standard Page Archetype',
        defaultTitle: options.defaultTitle,
        defaultDescription: options.defaultDescription,
    }),
    navigation: (options) => {
        const properties = {};
        if (options.schema) {
            for (const [k, builder] of Object.entries(options.schema)) {
                properties[k] = (builder && typeof builder.build === 'function') ? builder.build() : builder;
            }
        }
        return {
            collection: options.collection || 'site_navigation',
            menus: options.menus || ['header_main', 'header_dropdown', 'footer_primary', 'footer_legal'],
            schema: properties,
        };
    },
    section: (options) => ({
        kind: 'section',
        collection: options.collection || 'page_sections',
        key: options.key,
        strategy: options.strategy || 'cascade',
        children: options.children
            ? (options.children.kind === 'collection' || options.children.collectionName || options.children.collection
                ? { [options.children.collectionName || options.children.collection || 'items']: options.children }
                : options.children)
            : undefined,
        defaultData: options.defaultData,
        defaultTitle: options.defaultTitle,
        defaultDescription: options.defaultDescription,
        defaultPrimaryCtaText: options.defaultPrimaryCtaText,
        defaultPrimaryCtaUrl: options.defaultPrimaryCtaUrl,
        transform: options.transform,
        editor: options.editor,
    }),
    singleton: (collectionName, options = {}) => ({
        kind: 'singleton',
        collection: collectionName,
        strategy: options.strategy || 'reference',
    }),
    archetype: (name, slots, options = {}) => ({
        name,
        collection: options.collection || 'pages',
        template: options.template || 'standard',
        slots,
        description: options.description,
    }),
};
function normalizeKey(str) {
    return str.toLowerCase().replace(/[-_\s]+/g, '').replace(/s$/, '');
}
export function interpolateRouteTemplate(template, doc = {}) {
    let result = template;
    const data = doc.data || doc;
    const slugVal = data.slug || doc.slug || data.id || doc.id || '';
    // 1. Handle {slug}
    if (result.includes('{slug}')) {
        if (slugVal) {
            result = result.replace(/{slug}/g, encodeURIComponent(slugVal));
        }
        else {
            throw new Error(`[SlotWire] Route template '${template}' requires a slug, but none was provided in document context.`);
        }
    }
    // 2. Handle {id}
    if (result.includes('{id}')) {
        const idVal = data.id || doc.id;
        if (idVal) {
            result = result.replace(/{id}/g, encodeURIComponent(idVal));
        }
        else {
            throw new Error(`[SlotWire] Route template '${template}' requires an id, but none was provided in document context.`);
        }
    }
    // 3. Handle generic {field} tokens (e.g. {pageSlug})
    result = result.replace(/{([a-zA-Z0-9_-]+)}/g, (_, key) => {
        const val = data[key] ?? doc[key];
        if (val === undefined || val === null) {
            return '';
        }
        if (key === 'pageSlug' && val === 'home') {
            return '';
        }
        return encodeURIComponent(String(val));
    });
    // Clean up double slashes or trailing slash formatting
    result = result.replace(/\/+/g, '/');
    if (result.length > 1 && result.endsWith('/')) {
        result = result.slice(0, -1);
    }
    return result || '/';
}
export function resolvePreviewRoute(config, slotKeyOrCollection, doc = {}) {
    if (!slotKeyOrCollection)
        return '/';
    // Pass 1: Exact string match
    for (const [slotKey, slotDef] of Object.entries(config.slots)) {
        const collName = slotDef.kind === 'collection' ? slotDef.collectionName : slotKey;
        if (slotKey === slotKeyOrCollection || collName === slotKeyOrCollection) {
            const pattern = slotDef.previewRoutePattern ?? (typeof slotDef.previewRoute === 'string' ? slotDef.previewRoute : undefined);
            if (typeof pattern === 'function') {
                return pattern(doc);
            }
            if (typeof pattern === 'string') {
                return interpolateRouteTemplate(pattern, doc);
            }
            return '/';
        }
    }
    // Pass 2: Normalized fuzzy match (only if no exact match)
    const targetNorm = normalizeKey(slotKeyOrCollection);
    for (const [slotKey, slotDef] of Object.entries(config.slots)) {
        const collName = slotDef.kind === 'collection' ? slotDef.collectionName : slotKey;
        if (normalizeKey(slotKey) === targetNorm || normalizeKey(collName) === targetNorm) {
            const pattern = slotDef.previewRoutePattern ?? (typeof slotDef.previewRoute === 'string' ? slotDef.previewRoute : undefined);
            if (typeof pattern === 'function') {
                return pattern(doc);
            }
            if (typeof pattern === 'string') {
                return interpolateRouteTemplate(pattern, doc);
            }
            return '/';
        }
    }
    return null;
}
export function exportContractToJson(config) {
    const serializable = {
        cms: config.cms,
        slots: {},
    };
    for (const [key, def] of Object.entries(config.slots)) {
        serializable.slots[key] = {
            kind: def.kind,
            collectionName: def.collectionName || key,
            previewRoute: typeof def.previewRoutePattern === 'string'
                ? def.previewRoutePattern
                : (typeof def.previewRoute === 'string' ? def.previewRoute : '/'),
        };
    }
    return JSON.stringify(serializable, null, 2);
}
export function defineContract(config) {
    return config;
}
export const defineConfig = defineContract;
/**
 * Extracts the single-entry Zod schema for an Astro Content Layer collection from a SlotWire contract.
 * Automatically enables .passthrough() to permit system/CMS metadata (id, slug, status).
 */
export function getSlotEntryZodSchema(config, slotKeyOrCollection) {
    if (!config || !config.slots) {
        return z.record(z.unknown());
    }
    // 1. Direct slot key match
    let slotDef = config.slots[slotKeyOrCollection];
    // 2. Fuzzy/CollectionName match
    if (!slotDef) {
        for (const [key, def] of Object.entries(config.slots)) {
            const coll = def.collectionName || key;
            if (coll === slotKeyOrCollection) {
                slotDef = def;
                break;
            }
        }
    }
    if (slotDef && slotDef.properties) {
        const shape = {};
        for (const [propKey, fieldDef] of Object.entries(slotDef.properties)) {
            shape[propKey] = fieldDef.zodSchema || z.unknown();
        }
        return z.object(shape).passthrough();
    }
    return z.record(z.unknown());
}
/**
 * Generates an atomic bundle of records to be created across CMS collections from an Archetype contract.
 */
export function generateArchetypeScaffoldBundle(config, templateKey, options) {
    const targetSlug = options.pageSlug.replace(/^\/+|\/+$/g, '');
    const targetTitle = options.title ||
        targetSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    // Find archetype by key or template match
    let matchedKey = templateKey;
    if (config.archetypes && !config.archetypes[templateKey]) {
        for (const [key, arch] of Object.entries(config.archetypes)) {
            if (arch.template === templateKey) {
                matchedKey = key;
                break;
            }
        }
    }
    const blueprint = generateBlueprint(config, matchedKey, {
        targetSlug,
        targetTitle,
        template: templateKey,
        addToMenu: options.addToNav,
        menuKey: options.navMenu,
        customData: options.customData,
    });
    const records = blueprint.items
        .filter((item) => item.action === 'create')
        .map((item) => ({
        collection: item.collection,
        data: item.data,
    }));
    return {
        template: templateKey,
        slug: targetSlug,
        title: targetTitle,
        records,
        previewUrl: `/${targetSlug}?slotwire_preview=true`,
    };
}
/**
 * Introspects slot contract fields and maps them to UI editable field descriptors for the Quick Drawer.
 */
export function getSlotEditableFields(config, slotKeyOrCollection) {
    if (!config || !config.slots)
        return [];
    let slotDef = config.slots[slotKeyOrCollection];
    if (!slotDef) {
        for (const [key, def] of Object.entries(config.slots)) {
            const coll = def.collectionName || def.collection || key;
            if (coll === slotKeyOrCollection) {
                slotDef = def;
                break;
            }
        }
    }
    // Also check archetypes if not found in slots
    if (!slotDef && config.archetypes) {
        for (const [, arch] of Object.entries(config.archetypes)) {
            if (arch.slots && arch.slots[slotKeyOrCollection]) {
                slotDef = arch.slots[slotKeyOrCollection];
                break;
            }
        }
    }
    if (!slotDef || !slotDef.properties) {
        return [];
    }
    const fields = [];
    for (const [propName, fieldDef] of Object.entries(slotDef.properties)) {
        // Skip internal system fields
        if (['id', 'created_at', 'updated_at'].includes(propName))
            continue;
        const label = fieldDef.ui?.label ||
            propName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        let widgetType = 'text';
        if (fieldDef.ui?.widget) {
            if (fieldDef.ui.widget === 'markdown')
                widgetType = 'markdown';
            else if (fieldDef.ui.widget === 'textarea')
                widgetType = 'textarea';
            else if (fieldDef.ui.widget === 'url')
                widgetType = 'url';
            else if (fieldDef.ui.widget === 'select')
                widgetType = 'select';
            else if (fieldDef.ui.widget === 'toggle')
                widgetType = 'boolean';
            else if (fieldDef.ui.widget === 'media')
                widgetType = 'image';
            else
                widgetType = 'text';
        }
        else {
            // Inferred from type and field name
            if (fieldDef.type === 'boolean') {
                widgetType = 'boolean';
            }
            else if (fieldDef.type === 'number') {
                widgetType = 'number';
            }
            else if (fieldDef.type === 'media' || /image|avatar|photo|logo|banner|thumbnail/i.test(propName)) {
                widgetType = 'image';
            }
            else if (/url|link|href/i.test(propName)) {
                widgetType = 'url';
            }
            else if (/description|content|body|bio|summary|markdown/i.test(propName)) {
                widgetType = 'markdown';
            }
            else {
                widgetType = 'text';
            }
        }
        fields.push({
            name: propName,
            label,
            type: widgetType,
            required: fieldDef.required,
            defaultValue: fieldDef.defaultValue,
            placeholder: fieldDef.ui?.placeholder,
            options: fieldDef.ui?.options,
        });
    }
    return fields;
}
/**
 * Resolves the transformer function for a given slot or collection:
 * 1. Checks slot definition's explicit `transform` function.
 * 2. Checks `config.transformers[slotKey]` or `config.transformers['slots.' + slotKey]`.
 * 3. Checks `config.transformers[collection]` or `config.transformers['collections.' + collection]`.
 * 4. Checks `config.transformers[provider]`.
 * 5. Falls back to identity transformer `(x) => x`.
 */
export function resolveSlotTransformer(config, slotKeyOrCollection = '', context) {
    if (!config)
        return (item) => item;
    const key = slotKeyOrCollection.toLowerCase();
    const provider = (context?.provider || config.cms?.provider || 'directus').toLowerCase();
    const collection = (context?.collection || slotKeyOrCollection).toLowerCase();
    // 1. Direct slot definition transform
    const slotDef = config.slots?.[slotKeyOrCollection] || config.slots?.[key];
    if (slotDef && slotDef.transform && typeof slotDef.transform === 'function') {
        return slotDef.transform;
    }
    // Check archetype slot children or slots
    if (config.archetypes) {
        for (const arch of Object.values(config.archetypes)) {
            const archSlot = arch.slots?.[slotKeyOrCollection] || arch.slots?.[key];
            if (archSlot && archSlot.transform && typeof archSlot.transform === 'function') {
                return archSlot.transform;
            }
        }
    }
    // 2. Config transformers registry
    if (config.transformers) {
        const t = config.transformers;
        if (typeof t[slotKeyOrCollection] === 'function')
            return t[slotKeyOrCollection];
        if (typeof t[key] === 'function')
            return t[key];
        if (typeof t[`slots.${slotKeyOrCollection}`] === 'function')
            return t[`slots.${slotKeyOrCollection}`];
        if (typeof t[`slots.${key}`] === 'function')
            return t[`slots.${key}`];
        if (typeof t[collection] === 'function')
            return t[collection];
        if (typeof t[`collections.${collection}`] === 'function')
            return t[`collections.${collection}`];
        if (typeof t[provider] === 'function')
            return t[provider];
    }
    return (item) => item;
}
/**
 * Resolves the editor widget type ('markdown' | 'html') for a given slot:
 * 1. Checks slot definition's explicit `editor` property.
 * 2. Checks `config.ui?.editor`.
 * 3. Defaults to 'html' if provider is 'wordpress', otherwise 'markdown'.
 */
export function resolveSlotEditor(config, slotKeyOrCollection = '') {
    if (!config)
        return 'markdown';
    const key = slotKeyOrCollection.toLowerCase();
    const slotDef = config.slots?.[slotKeyOrCollection] || config.slots?.[key];
    if (slotDef && slotDef.editor) {
        return slotDef.editor;
    }
    if (config.ui?.editor) {
        return config.ui.editor;
    }
    const provider = (config.cms?.provider || '').toLowerCase();
    if (provider === 'wordpress') {
        return 'html';
    }
    return 'markdown';
}
//# sourceMappingURL=schema.js.map