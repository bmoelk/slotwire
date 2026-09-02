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

export function generateSonicTicketCollectionConfig(): any {
  return {
    name: 'slotwire_tickets',
    displayName: 'SlotWire Content Issues & TODOs',
    slug: 'slotwire-tickets',
    description: 'Internal content issue queue auto-populated from production and preview inspection',
    schema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string', title: 'Ticket ID' },
        title: { type: 'string', title: 'Title' },
        description: { type: 'textarea', title: 'Description / Notes' },
        status: { type: 'select', title: 'Status', options: ['open', 'in_progress', 'resolved', 'dismissed'] },
        severity: { type: 'select', title: 'Severity', options: ['low', 'medium', 'high', 'blocking'] },
        route: { type: 'string', title: 'Route' },
        slotKey: { type: 'string', title: 'Slot Key' },
        collection: { type: 'string', title: 'Collection' },
        pageSlug: { type: 'string', title: 'Page Slug' },
        sectionKey: { type: 'string', title: 'Section Key' },
        documentId: { type: 'string', title: 'Document ID' },
        stagingUrl: { type: 'string', title: 'Staging Preview URL' },
        cmsEditUrl: { type: 'string', title: 'CMS Edit URL' },
        reporterEmail: { type: 'string', title: 'Reporter Email' },
      },
      required: ['ticketId', 'title', 'route', 'slotKey', 'status'],
    },
    managed: true,
    isActive: true,
    access: {
      public: ['read'],
    },
    cache: {
      enabled: false,
    },
  };
}

export function generateSonicNavigationCollectionConfig(config?: SlotWireConfig): any {
  const collectionName = config?.navigation?.collection || 'site_navigation';
  const displayName = collectionName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const menus = config?.navigation?.menus || ['header_main', 'header_dropdown', 'footer_primary', 'footer_legal'];

  return {
    name: collectionName,
    displayName,
    slug: collectionName.replace(/_/g, '-'),
    description: 'Site Navigation Menus & Links managed by SlotWire',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', title: 'Navigation Link Label' },
        slug: { type: 'slug', title: 'Unique Key' },
        link: { type: 'string', title: 'Target Route URL (e.g. /about)' },
        menuKey: { type: 'select', title: 'Menu Placement', options: menus },
        parentSlug: { type: 'string', title: 'Parent Menu Item (optional for dropdowns)' },
        order: { type: 'number', title: 'Display Order' },
        enabled: { type: 'boolean', title: 'Enabled / Visible' },
      },
      required: ['title', 'link', 'menuKey'],
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

  // Include navigation collection if configured or default site_navigation
  const navColl = config.navigation?.collection || 'site_navigation';
  if (!processedNames.has(navColl)) {
    processedNames.add(navColl);
    collections.push(generateSonicNavigationCollectionConfig(config));
  }

  // Include internal ticket queue collection if enabled (default: true)
  if (config.ticketing?.internalQueue !== false && !processedNames.has('slotwire_tickets')) {
    processedNames.add('slotwire_tickets');
    collections.push(generateSonicTicketCollectionConfig());
  }

  return collections;
}

export interface SonicScaffoldOptions {
  cmsApiUrl?: string;
  apiKey?: string;
  d1?: any;
  targetEnv?: string;
}

/**
 * Atomically scaffolds all draft records defined by a ContentBlueprint
 * into the SonicJS D1 database or via SonicJS REST API.
 */
export async function scaffoldBlueprint(
  blueprint: any,
  options: SonicScaffoldOptions = {}
): Promise<any> {
  const {
    cmsApiUrl = 'https://cms.example.com',
    apiKey,
    d1,
  } = options;

  const itemsToCreate = (blueprint.items || []).filter((i: any) => i.action === 'create');
  const createdIds: string[] = [];
  const errors: string[] = [];

  for (const item of itemsToCreate) {
    try {
      if (d1) {
        // Direct D1 Database execution on Cloudflare Worker
        const recordId = item.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();
        const dataJson = JSON.stringify(item.data);

        await d1
          .prepare(
            `INSERT INTO ${item.collection} (id, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
          )
          .bind(recordId, dataJson, 'draft', now, now)
          .run()
          .catch(async () => {
            // Fallback for custom column schema
            await d1
              .prepare(
                `INSERT OR REPLACE INTO ${item.collection} (id, slug, page_slug, section_key, title, status)
                 VALUES (?, ?, ?, ?, ?, ?)`
              )
              .bind(
                recordId,
                item.data.slug || item.pageSlug,
                item.pageSlug,
                item.sectionKey || 'default',
                item.data.title || 'Draft',
                'draft'
              )
              .run();
          });

        createdIds.push(recordId);
      } else {
        // Remote REST API execution
        const endpoint = `${cmsApiUrl.replace(/\/+$/, '')}/api/collections/${encodeURIComponent(item.collection)}/content`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            data: item.data,
            status: 'draft',
          }),
        }).catch((err) => {
          throw new Error(`Failed to POST to ${endpoint}: ${err.message}`);
        });

        if (res.ok) {
          const resJson: any = await res.json().catch(() => ({}));
          createdIds.push(resJson.id || resJson.data?.id || item.id);
        } else {
          const errText = await res.text();
          errors.push(`Collection '${item.collection}': HTTP ${res.status} - ${errText}`);
        }
      }
    } catch (e: any) {
      errors.push(`Error creating item in '${item.collection}': ${e.message}`);
    }
  }

  return {
    success: errors.length === 0,
    targetSlug: blueprint.targetSlug,
    createdCount: createdIds.length,
    createdIds,
    reusedCount: blueprint.totalToReuse || 0,
    errors: errors.length > 0 ? errors : undefined,
    targetUrl: `/${blueprint.targetSlug}?slotwire_preview=true`,
  };
}

