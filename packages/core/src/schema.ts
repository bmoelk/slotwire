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
};

export function resolvePreviewRoute(config: SlotWireConfig, slotKeyOrCollection: string, doc: Record<string, any> = {}): string | null {
  for (const [slotKey, slotDef] of Object.entries(config.slots)) {
    const isMatch = slotKey === slotKeyOrCollection || 
      (slotDef.kind === 'collection' && slotDef.collectionName === slotKeyOrCollection);
    if (isMatch) {
      const pattern = (slotDef as any).previewRoutePattern || (slotDef as any).previewRoute;
      if (typeof pattern === 'function') {
        return pattern(doc);
      }
      if (typeof pattern === 'string') {
        return pattern;
      }
      return '/';
    }
  }
  return null;
}

export function defineContract(config: SlotWireConfig): SlotWireConfig {
  return config;
}

export const defineConfig = defineContract;

