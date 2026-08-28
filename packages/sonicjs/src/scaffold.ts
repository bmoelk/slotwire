import type { SlotDefinition, FieldDefinition, SlotWireConfig } from '@slotwire/core';

export function fieldDefinitionToSonicSchema(field: FieldDefinition): Record<string, any> {
  const schema: Record<string, any> = {
    title: field.description || undefined,
    required: field.required ?? true,
  };

  switch (field.type) {
    case 'string':
      schema.type = 'string';
      if (field.maxLength) schema.maxLength = field.maxLength;
      break;
    case 'textarea':
      schema.type = 'textarea';
      if (field.maxLength) schema.maxLength = field.maxLength;
      break;
    case 'number':
      schema.type = 'number';
      break;
    case 'boolean':
      schema.type = 'boolean';
      break;
    case 'slug':
      schema.type = 'slug';
      break;
    case 'url':
      schema.type = 'string';
      break;
    case 'email':
      schema.type = 'string';
      break;
    case 'datetime':
      schema.type = 'datetime';
      break;
    case 'media':
      schema.type = 'string';
      break;
    case 'richText':
      schema.type = 'lexical';
      break;
    case 'enum':
      schema.type = 'select';
      schema.options = field.options || [];
      break;
    case 'reference':
      schema.type = 'user';
      break;
    case 'array':
      schema.type = 'string';
      break;
    default:
      schema.type = 'string';
  }

  return schema;
}

export function generateSonicCollectionConfig(slotKey: string, slotDef: SlotDefinition): any {
  const isCollection = slotDef.kind === 'collection';
  const name = isCollection ? slotDef.collectionName : 'homepage_sections';
  const displayName = isCollection
    ? slotDef.collectionName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Homepage Sections';

  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(slotDef.properties)) {
    properties[key] = fieldDefinitionToSonicSchema(field);
    if (field.required) {
      required.push(key);
    }
  }

  return {
    name,
    displayName,
    slug: name.replace(/_/g, '-'),
    description: `Auto-scaffolded by SlotWire for slot '${slotKey}'`,
    schema: {
      type: 'object',
      properties,
      required,
    },
    managed: true,
    isActive: true,
    access: {
      public: ['read'],
    },
    cache: {
      enabled: true,
      ttl: 5,
    },
  };
}

export function scaffoldAllSonicCollections(config: SlotWireConfig): any[] {
  const collections: any[] = [];
  const processedNames = new Set<string>();

  for (const [slotKey, slotDef] of Object.entries(config.slots)) {
    const name = slotDef.kind === 'collection' ? slotDef.collectionName : 'homepage_sections';
    if (!processedNames.has(name)) {
      processedNames.add(name);
      collections.push(generateSonicCollectionConfig(slotKey, slotDef));
    }
  }

  return collections;
}
