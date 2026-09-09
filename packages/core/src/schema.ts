import { z } from 'zod';
import type {
  FieldDefinition,
  SlotDefinition,
  SlotWireConfig,
  MediaFieldOptions,
  ScaffoldBundle,
  ScaffoldRecord,
  EditableFieldDescriptor,
  SlotTransformer,
} from './types.js';
import { generateBlueprint } from './blueprint.js';

class FieldBuilder {
  private def: Partial<FieldDefinition> = {
    required: true,
  };

  constructor(type: FieldDefinition['type'], zodSchema: z.ZodTypeAny) {
    this.def.type = type;
    this.def.zodSchema = zodSchema;
  }

  optional() {
    this.def.required = false;
    this.def.zodSchema = this.def.zodSchema?.optional();
    return this;
  }

  max(length: number) {
    this.def.maxLength = length;
    if (this.def.zodSchema instanceof z.ZodString) {
      this.def.zodSchema = this.def.zodSchema.max(length);
    }
    return this;
  }

  describe(desc: string) {
    this.def.description = desc;
    return this;
  }

  mediaOptions(opts: MediaFieldOptions) {
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

  build(): FieldDefinition {
    return this.def as FieldDefinition;
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
  media: (options: MediaFieldOptions = {}) => {
    const builder = new FieldBuilder('media', z.string());
    (builder as any).def.mediaOptions = {
      checkExists: true,
      ...options,
    };
    if (options.required === false) {
      builder.optional();
    }
    return builder;
  },
  image: (options: MediaFieldOptions = {}) => {
    return s.media({
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'avif'],
      ...options,
    });
  },
  richText: () => new FieldBuilder('richText', z.string().or(z.record(z.unknown()))),
  
  enum: <T extends string>(values: [T, ...T[]]) => {
    const builder = new FieldBuilder('enum', z.enum(values));
    (builder as any).def.options = values;
    return builder;
  },

  reference: (targetCollection: string) => {
    const builder = new FieldBuilder('reference', z.string().or(z.record(z.unknown())));
    (builder as any).def.refTarget = targetCollection;
    return builder;
  },

  array: (itemBuilder: FieldBuilder) => {
    const itemDef = itemBuilder.build();
    const builder = new FieldBuilder('array', z.array(itemDef.zodSchema));
    (builder as any).def.items = itemDef;
    return builder;
  },

  object: (
    props: Record<string, FieldBuilder>,
    options: { transform?: SlotTransformer; editor?: 'markdown' | 'html' } = {}
  ) => {
    const properties: Record<string, FieldDefinition> = {};
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [key, builder] of Object.entries(props)) {
      properties[key] = builder.build();
      shape[key] = properties[key].zodSchema;
    }
    const def: any = {
      kind: 'object',
      properties,
      zodSchema: z.object(shape),
      previewRoute: undefined,
      transform: options.transform,
      editor: options.editor,
    };
    def.previewRoute = (route: string | ((doc: any) => string)) => {
      def.previewRoutePattern = route;
      return def;
    };
    return def;
  },

  collection: (
    collectionName: string,
    props: Record<string, FieldBuilder>,
    options: { transform?: SlotTransformer; editor?: 'markdown' | 'html' } = {}
  ) => {
    const properties: Record<string, FieldDefinition> = {};
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [key, builder] of Object.entries(props)) {
      properties[key] = builder.build();
      shape[key] = properties[key].zodSchema;
    }
    const def: any = {
      kind: 'collection',
      collectionName,
      properties,
      zodSchema: z.array(z.object(shape)),
      previewRoute: undefined,
      transform: options.transform,
      editor: options.editor,
    };
    def.previewRoute = (route: string | ((doc: any) => string)) => {
      def.previewRoutePattern = route;
      return def;
    };
    return def;
  },

  // Archetype Builders for Blueprint Resolution
  page: (options: {
    collection?: string;
    template?: string;
    label?: string;
    slots: Record<string, any>;
    description?: string;
    defaultTitle?: string;
    defaultDescription?: string;
  }) => ({
    name: 'page',
    collection: options.collection || 'pages',
    template: options.template || 'standard',
    label: options.label,
    slots: options.slots,
    description: options.description || 'Standard Page Archetype',
    defaultTitle: options.defaultTitle,
    defaultDescription: options.defaultDescription,
  }),

  navigation: (options: {
    collection?: string;
    menus?: string[];
    schema?: Record<string, FieldBuilder | any>;
  }) => {
    const properties: Record<string, FieldDefinition> = {};
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

  section: (options: {
    key?: string;
    collection?: string;
    strategy?: 'cascade' | 'reference';
    children?: Record<string, any> | any;
    defaultData?: Record<string, any>;
    defaultTitle?: string;
    defaultDescription?: string;
    defaultPrimaryCtaText?: string;
    defaultPrimaryCtaUrl?: string;
    transform?: SlotTransformer;
    editor?: 'markdown' | 'html';
  }) => ({
    kind: 'section' as const,
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

  singleton: (collectionName: string, options: { strategy?: 'reference' } = {}) => ({
    kind: 'singleton' as const,
    collection: collectionName,
    strategy: options.strategy || 'reference',
  }),

  archetype: (
    name: string,
    slots: Record<string, any>,
    options: { collection?: string; template?: string; description?: string } = {}
  ) => ({
    name,
    collection: options.collection || 'pages',
    template: options.template || 'standard',
    slots,
    description: options.description,
  }),
};

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[-_\s]+/g, '').replace(/s$/, '');
}

export function interpolateRouteTemplate(template: string, doc: Record<string, any> = {}): string {
  let result = template;
  const data = doc.data || doc;
  const slugVal = data.slug || doc.slug || data.id || doc.id || '';

  // 1. Handle {slug}
  if (result.includes('{slug}')) {
    if (slugVal) {
      result = result.replace(/{slug}/g, encodeURIComponent(slugVal));
    } else {
      throw new Error(`[SlotWire] Route template '${template}' requires a slug, but none was provided in document context.`);
    }
  }

  // 2. Handle {id}
  if (result.includes('{id}')) {
    const idVal = data.id || doc.id;
    if (idVal) {
      result = result.replace(/{id}/g, encodeURIComponent(idVal));
    } else {
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

export function resolvePreviewRoute(config: SlotWireConfig, slotKeyOrCollection: string, doc: Record<string, any> = {}): string | null {
  if (!slotKeyOrCollection) return '/';
  
  // Pass 1: Exact string match
  for (const [slotKey, slotDef] of Object.entries(config.slots)) {
    const collName = slotDef.kind === 'collection' ? slotDef.collectionName : slotKey;
    if (slotKey === slotKeyOrCollection || collName === slotKeyOrCollection) {
      const pattern = (slotDef as any).previewRoutePattern ?? (typeof (slotDef as any).previewRoute === 'string' ? (slotDef as any).previewRoute : undefined);
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
      const pattern = (slotDef as any).previewRoutePattern ?? (typeof (slotDef as any).previewRoute === 'string' ? (slotDef as any).previewRoute : undefined);
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

export function exportContractToJson(config: SlotWireConfig): string {
  const serializable: any = {
    cms: config.cms,
    slots: {} as Record<string, any>,
  };

  for (const [key, def] of Object.entries(config.slots)) {
    serializable.slots[key] = {
      kind: def.kind,
      collectionName: (def as any).collectionName || key,
      previewRoute: typeof (def as any).previewRoutePattern === 'string' 
        ? (def as any).previewRoutePattern 
        : (typeof (def as any).previewRoute === 'string' ? (def as any).previewRoute : '/'),
    };
  }

  return JSON.stringify(serializable, null, 2);
}

export function defineContract(config: SlotWireConfig): SlotWireConfig {
  return config;
}

export const defineConfig = defineContract;

/**
 * Extracts the single-entry Zod schema for an Astro Content Layer collection from a SlotWire contract.
 * Automatically enables .passthrough() to permit system/CMS metadata (id, slug, status).
 */
export function getSlotEntryZodSchema(config: SlotWireConfig, slotKeyOrCollection: string): z.ZodTypeAny {
  if (!config || !config.slots) {
    return z.record(z.unknown());
  }

  // 1. Direct slot key match
  let slotDef: any = config.slots[slotKeyOrCollection];

  // 2. Fuzzy/CollectionName match
  if (!slotDef) {
    for (const [key, def] of Object.entries(config.slots)) {
      const coll = (def as any).collectionName || key;
      if (coll === slotKeyOrCollection) {
        slotDef = def;
        break;
      }
    }
  }

  if (slotDef && slotDef.properties) {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [propKey, fieldDef] of Object.entries(slotDef.properties as Record<string, FieldDefinition>)) {
      shape[propKey] = fieldDef.zodSchema || z.unknown();
    }
    return z.object(shape).passthrough();
  }

  return z.record(z.unknown());
}

export interface GenerateArchetypeBundleOptions {
  pageSlug: string;
  title?: string;
  addToNav?: boolean;
  navMenu?: string;
  customData?: Record<string, any>;
}

/**
 * Generates an atomic bundle of records to be created across CMS collections from an Archetype contract.
 */
export function generateArchetypeScaffoldBundle(
  config: SlotWireConfig,
  templateKey: string,
  options: GenerateArchetypeBundleOptions
): ScaffoldBundle {
  const targetSlug = options.pageSlug.replace(/^\/+|\/+$/g, '');
  const targetTitle =
    options.title ||
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

  const records: ScaffoldRecord[] = blueprint.items
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
export function getSlotEditableFields(
  config: SlotWireConfig,
  slotKeyOrCollection: string
): EditableFieldDescriptor[] {
  if (!config || !config.slots) return [];

  let slotDef: any = config.slots[slotKeyOrCollection];
  if (!slotDef) {
    for (const [key, def] of Object.entries(config.slots)) {
      const coll = (def as any).collectionName || (def as any).collection || key;
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

  const fields: EditableFieldDescriptor[] = [];

  for (const [propName, fieldDef] of Object.entries(slotDef.properties as Record<string, FieldDefinition>)) {
    // Skip internal system fields
    if (['id', 'created_at', 'updated_at'].includes(propName)) continue;

    const label =
      fieldDef.ui?.label ||
      propName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    let widgetType: EditableFieldDescriptor['type'] = 'text';

    if (fieldDef.ui?.widget) {
      if (fieldDef.ui.widget === 'markdown') widgetType = 'markdown';
      else if (fieldDef.ui.widget === 'textarea') widgetType = 'textarea';
      else if (fieldDef.ui.widget === 'url') widgetType = 'url';
      else if (fieldDef.ui.widget === 'select') widgetType = 'select';
      else if (fieldDef.ui.widget === 'toggle') widgetType = 'boolean';
      else if (fieldDef.ui.widget === 'media') widgetType = 'image';
      else widgetType = 'text';
    } else {
      // Inferred from type and field name
      if (fieldDef.type === 'boolean') {
        widgetType = 'boolean';
      } else if (fieldDef.type === 'number') {
        widgetType = 'number';
      } else if (fieldDef.type === 'media' || /image|avatar|photo|logo|banner|thumbnail/i.test(propName)) {
        widgetType = 'image';
      } else if (/url|link|href/i.test(propName)) {
        widgetType = 'url';
      } else if (/description|content|body|bio|summary|markdown/i.test(propName)) {
        widgetType = 'markdown';
      } else {
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
export function resolveSlotTransformer(
  config?: SlotWireConfig,
  slotKeyOrCollection: string = '',
  context?: { archetype?: string; collection?: string; provider?: string }
): SlotTransformer {
  if (!config) return (item: any) => item;

  const key = slotKeyOrCollection.toLowerCase();
  const provider = (context?.provider || config.cms?.provider || 'directus').toLowerCase();
  const collection = (context?.collection || slotKeyOrCollection).toLowerCase();

  // 1. Direct slot definition transform
  const slotDef = config.slots?.[slotKeyOrCollection] || config.slots?.[key];
  if (slotDef && (slotDef as any).transform && typeof (slotDef as any).transform === 'function') {
    return (slotDef as any).transform;
  }

  // Check archetype slot children or slots
  if (config.archetypes) {
    for (const arch of Object.values(config.archetypes)) {
      const archSlot = arch.slots?.[slotKeyOrCollection] || arch.slots?.[key];
      if (archSlot && (archSlot as any).transform && typeof (archSlot as any).transform === 'function') {
        return (archSlot as any).transform;
      }
    }
  }

  // 2. Config transformers registry
  if (config.transformers) {
    const t = config.transformers;
    if (typeof t[slotKeyOrCollection] === 'function') return t[slotKeyOrCollection];
    if (typeof t[key] === 'function') return t[key];
    if (typeof t[`slots.${slotKeyOrCollection}`] === 'function') return t[`slots.${slotKeyOrCollection}`];
    if (typeof t[`slots.${key}`] === 'function') return t[`slots.${key}`];
    if (typeof t[collection] === 'function') return t[collection];
    if (typeof t[`collections.${collection}`] === 'function') return t[`collections.${collection}`];
    if (typeof t[provider] === 'function') return t[provider];
  }

  return (item: any) => item;
}

/**
 * Resolves the editor widget type ('markdown' | 'html') for a given slot:
 * 1. Checks slot definition's explicit `editor` property.
 * 2. Checks `config.ui?.editor`.
 * 3. Defaults to 'html' if provider is 'wordpress', otherwise 'markdown'.
 */
export function resolveSlotEditor(
  config?: SlotWireConfig,
  slotKeyOrCollection: string = ''
): 'markdown' | 'html' {
  if (!config) return 'markdown';

  const key = slotKeyOrCollection.toLowerCase();
  const slotDef = config.slots?.[slotKeyOrCollection] || config.slots?.[key];
  if (slotDef && (slotDef as any).editor) {
    return (slotDef as any).editor;
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
