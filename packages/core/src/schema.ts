import { z } from 'zod';
import type { FieldDefinition, SlotDefinition, SlotWireConfig } from './types.js';

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
  media: () => new FieldBuilder('media', z.string()),
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

  object: (props: Record<string, FieldBuilder>) => {
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
    };
    def.previewRoute = (route: string | ((doc: any) => string)) => {
      def.previewRoutePattern = route;
      return def;
    };
    return def;
  },

  collection: (collectionName: string, props: Record<string, FieldBuilder>) => {
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
    slots: Record<string, any>;
    description?: string;
  }) => ({
    name: 'page',
    collection: options.collection || 'pages',
    slots: options.slots,
    description: options.description || 'Standard Page Archetype',
  }),

  section: (options: {
    key?: string;
    collection?: string;
    strategy?: 'cascade' | 'reference';
    children?: Record<string, any> | any;
    defaultData?: Record<string, any>;
  }) => ({
    kind: 'section' as const,
    collection: options.collection || 'page_sections',
    key: options.key,
    strategy: options.strategy || 'cascade',
    children: options.children && !options.children.collection
      ? options.children
      : (options.children ? { items: options.children } : undefined),
    defaultData: options.defaultData,
  }),

  singleton: (collectionName: string, options: { strategy?: 'reference' } = {}) => ({
    kind: 'singleton' as const,
    collection: collectionName,
    strategy: options.strategy || 'reference',
  }),

  archetype: (
    name: string,
    slots: Record<string, any>,
    options: { collection?: string; description?: string } = {}
  ) => ({
    name,
    collection: options.collection || 'pages',
    slots,
    description: options.description,
  }),
};

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[-_\s]+/g, '').replace(/s$/, '');
}

export function interpolateRouteTemplate(template: string, doc: Record<string, any> = {}): string {
  let result = template;
  const slugVal = doc.slug || doc.id || '';

  if (result.includes('{slug}')) {
    if (slugVal) {
      result = result.replace(/{slug}/g, encodeURIComponent(slugVal));
    } else {
      throw new Error(`[SlotWire] Route template '${template}' requires a slug, but none was provided in document context.`);
    }
  }

  if (result.includes('{id}')) {
    if (doc.id) {
      result = result.replace(/{id}/g, encodeURIComponent(doc.id));
    } else {
      throw new Error(`[SlotWire] Route template '${template}' requires an id, but none was provided in document context.`);
    }
  }

  return result;
}

export function resolvePreviewRoute(config: SlotWireConfig, slotKeyOrCollection: string, doc: Record<string, any> = {}): string | null {
  if (!slotKeyOrCollection) return '/';
  
  // Pass 1: Exact string match
  for (const [slotKey, slotDef] of Object.entries(config.slots)) {
    const collName = slotDef.kind === 'collection' ? slotDef.collectionName : slotKey;
    if (slotKey === slotKeyOrCollection || collName === slotKeyOrCollection) {
      const pattern = (slotDef as any).previewRoutePattern || (slotDef as any).previewRoute;
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
      const pattern = (slotDef as any).previewRoutePattern || (slotDef as any).previewRoute;
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

