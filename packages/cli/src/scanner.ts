import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface ScannedSlot {
  slot: string;
  archetype?: string;
  collection?: string;
  pageSlug?: string;
  sectionKey?: string;
  documentId?: string;
  isGhost: boolean;
  required: boolean;
  rawSnippet?: string;
}

export interface ScannedRoute {
  route: string;
  filePath: string;
  slots: ScannedSlot[];
  totalSlots: number;
  populatedSlots: number;
  ghostSlots: number;
  isComplete: boolean;
}

export interface ScanResult {
  timestamp: string;
  targetDir: string;
  totalRoutes: number;
  totalSlots: number;
  populatedSlots: number;
  ghostSlots: number;
  routes: ScannedRoute[];
  isClean: boolean;
  errors: string[];
}

export interface ScanOptions {
  strict?: boolean;
  configPath?: string;
  cmsUrl?: string;
}

/**
 * Extracts all SlotWire declared slots from an HTML string using attribute scanning.
 */
export function extractSlotsFromHtml(html: string): ScannedSlot[] {
  const slots: ScannedSlot[] = [];

  // Match elements containing data-slotwire-slot
  const elementRegex = /<([a-zA-Z0-9-]+)\s+([^>]*data-slotwire-slot[^>]*)>/gi;
  let match: RegExpExecArray | null;

  while ((match = elementRegex.exec(html)) !== null) {
    const fullAttributes = match[2];

    const slotMatch = /data-slotwire-slot=["']([^"']+)["']/i.exec(fullAttributes);
    if (!slotMatch) continue;

    const archetypeMatch = /data-slotwire-archetype=["']([^"']+)["']/i.exec(fullAttributes);
    const collectionMatch = /data-slotwire-collection=["']([^"']+)["']/i.exec(fullAttributes);
    const pageMatch = /data-slotwire-page=["']([^"']+)["']/i.exec(fullAttributes);
    const sectionMatch = /data-slotwire-section=["']([^"']+)["']/i.exec(fullAttributes);
    const idMatch = /data-slotwire-id=["']([^"']+)["']/i.exec(fullAttributes);
    const isGhost =
      /data-slotwire-ghost=["']true["']/i.test(fullAttributes) ||
      /class=["'][^"']*slotwire-ghost-slot[^"']*["']/i.test(fullAttributes);
    const isRequired = /data-slotwire-required=["']true["']/i.test(fullAttributes) || isGhost;

    slots.push({
      slot: slotMatch[1],
      archetype: archetypeMatch ? archetypeMatch[1] : undefined,
      collection: collectionMatch ? collectionMatch[1] : undefined,
      pageSlug: pageMatch ? pageMatch[1] : undefined,
      sectionKey: sectionMatch ? sectionMatch[1] : undefined,
      documentId: idMatch ? idMatch[1] : undefined,
      isGhost,
      required: isRequired,
    });
  }

  return slots;
}

/**
 * Recursively scans a directory for built HTML files and audits all SlotWire slot declarations.
 */
export async function scanHtmlDirectory(
  distDir: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const resolvedDir = path.resolve(distDir);
  const errors: string[] = [];
  const routes: ScannedRoute[] = [];

  async function findHtmlFiles(currentDir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          files.push(...(await findHtmlFiles(fullPath)));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
          files.push(fullPath);
        }
      }
    } catch (e: any) {
      errors.push(`Directory read error: ${e.message}`);
    }
    return files;
  }

  const htmlFiles = await findHtmlFiles(resolvedDir);

  for (const filePath of htmlFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const slots = extractSlotsFromHtml(content);

      if (slots.length > 0) {
        // Derive canonical route path from filesystem structure
        const relativePath = path.relative(resolvedDir, filePath).replace(/\\/g, '/');
        let route = '/' + relativePath.replace(/\/index\.html$/, '').replace(/\.html$/, '');
        if (route === '/index' || route === '') route = '/';

        const totalSlots = slots.length;
        const ghostSlots = slots.filter((s) => s.isGhost).length;
        const populatedSlots = totalSlots - ghostSlots;
        const isComplete = ghostSlots === 0;

        if (options.strict && ghostSlots > 0) {
          errors.push(
            `Route '${route}' has ${ghostSlots} unpopulated ghost slot(s): ${slots.filter((s) => s.isGhost).map((s) => s.slot).join(', ')}`
          );
        }

        routes.push({
          route,
          filePath: relativePath,
          slots,
          totalSlots,
          populatedSlots,
          ghostSlots,
          isComplete,
        });
      }
    } catch (err: any) {
      errors.push(`Error parsing '${filePath}': ${err.message}`);
    }
  }

  const totalRoutes = routes.length;
  const totalSlots = routes.reduce((sum, r) => sum + r.totalSlots, 0);
  const populatedSlots = routes.reduce((sum, r) => sum + r.populatedSlots, 0);
  const ghostSlots = routes.reduce((sum, r) => sum + r.ghostSlots, 0);
  const isClean = errors.length === 0 && (!options.strict || ghostSlots === 0);

  return {
    timestamp: new Date().toISOString(),
    targetDir: resolvedDir,
    totalRoutes,
    totalSlots,
    populatedSlots,
    ghostSlots,
    routes,
    isClean,
    errors,
  };
}
