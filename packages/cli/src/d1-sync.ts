import type { SlotWireConfig } from '@slotwire/core';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

export interface D1SyncOptions {
  configPath?: string;
  outputPath?: string;
  viewPrefix?: string;
}

export function generateD1ViewsSql(
  config: SlotWireConfig,
  options: { viewPrefix?: string } = {}
): string {
  const prefix = options.viewPrefix ?? 'view_';
  const statements: string[] = [
    '--',
    '-- SlotWire Automated D1/SQLite Views Synchronization',
    '-- Generated from slotwire.config.ts contract definitions',
    '--',
  ];

  // Collect collections and their schema fields from slots
  const collectionsMap = new Map<string, Set<string>>();

  if (config.slots) {
    for (const [key, def] of Object.entries(config.slots)) {
      const colName = (def as any).collectionName || (def as any).collection || key;
      if (!collectionsMap.has(colName)) {
        collectionsMap.set(colName, new Set());
      }
      const fieldSet = collectionsMap.get(colName)!;

      if ((def as any).properties) {
        for (const prop of Object.keys((def as any).properties)) {
          // Exclude base columns already in documents table
          if (!['id', 'slug', 'title', 'status', 'created_at', 'updated_at'].includes(prop)) {
            fieldSet.add(prop);
          }
        }
      }
    }
  }

  // Also collect collections referenced in archetypes
  if (config.archetypes) {
    for (const [, arch] of Object.entries(config.archetypes)) {
      if (arch.collection && !collectionsMap.has(arch.collection)) {
        collectionsMap.set(arch.collection, new Set());
      }
      if (arch.slots) {
        for (const [, slotDef] of Object.entries(arch.slots)) {
          const colName = (slotDef as any).collection || 'page_sections';
          if (!collectionsMap.has(colName)) {
            collectionsMap.set(colName, new Set());
          }
          const fieldSet = collectionsMap.get(colName)!;
          if ((slotDef as any).defaultData) {
            for (const k of Object.keys((slotDef as any).defaultData)) {
              if (!['id', 'slug', 'title', 'status', 'created_at', 'updated_at'].includes(k)) {
                fieldSet.add(k);
              }
            }
          }
        }
      }
    }
  }

  // Navigation collection if defined
  if (config.navigation?.collection) {
    const navCol = config.navigation.collection;
    if (!collectionsMap.has(navCol)) {
      collectionsMap.set(navCol, new Set());
    }
    const navFields = collectionsMap.get(navCol)!;
    navFields.add('link');
    navFields.add('menuKey');
    navFields.add('order');
    navFields.add('parentKey');
  }

  for (const [collection, fields] of collectionsMap.entries()) {
    const viewName = `${prefix}${collection}`;
    const fieldProjections: string[] = [];

    for (const field of Array.from(fields).sort()) {
      fieldProjections.push(`  json_extract(data, '$.${field}') AS ${field}`);
    }

    const fieldClause = fieldProjections.length > 0 ? `,\n${fieldProjections.join(',\n')}` : '';

    statements.push(`
DROP VIEW IF EXISTS ${viewName};
CREATE VIEW ${viewName} AS
SELECT
  id,
  collection,
  slug,
  title,
  status,
  publish_at${fieldClause},
  created_at,
  updated_at
FROM documents
WHERE collection = '${collection}';`);
  }

  return statements.join('\n') + '\n';
}

/**
 * Loads slotwire.config.ts / .js and generates D1 SQL view migration.
 */
export async function syncD1Views(options: D1SyncOptions = {}): Promise<string> {
  const configPath = options.configPath || path.resolve(process.cwd(), 'slotwire.config.ts');
  let config: SlotWireConfig;

  try {
    const imported = await import(configPath);
    config = imported.default || imported.config || imported;
  } catch (err: any) {
    // If .ts fails without ts-node/loader, try .js
    const jsPath = configPath.replace(/\.ts$/, '.js');
    try {
      const imported = await import(jsPath);
      config = imported.default || imported.config || imported;
    } catch {
      throw new Error(`Failed to load SlotWire config at '${configPath}': ${err.message}`);
    }
  }

  const sql = generateD1ViewsSql(config, { viewPrefix: options.viewPrefix });

  if (options.outputPath) {
    const targetFile = path.resolve(process.cwd(), options.outputPath);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, sql, 'utf-8');
  }

  return sql;
}
