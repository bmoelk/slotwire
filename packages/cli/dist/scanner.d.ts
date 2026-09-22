export interface ScannedSlot {
    slot: string;
    archetype?: string;
    collection?: string;
    pageSlug?: string;
    sectionKey?: string;
    documentId?: string;
    source: 'cms' | 'fallback' | 'ghost';
    isGhost: boolean;
    required: boolean;
    rawSnippet?: string;
}
export interface ScannedRoute {
    route: string;
    filePath: string;
    slots: ScannedSlot[];
    totalSlots: number;
    cmsSlots: number;
    fallbackSlots: number;
    ghostSlots: number;
    isComplete: boolean;
}
export interface ScanResult {
    timestamp: string;
    targetDir: string;
    auditTarget: string;
    cmsApiUrl?: string;
    totalRoutes: number;
    totalSlots: number;
    cmsSlots: number;
    fallbackSlots: number;
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
export declare function extractSlotsFromHtml(html: string): ScannedSlot[];
/**
 * Recursively scans a directory for built HTML files and audits all SlotWire slot declarations.
 */
export declare function scanHtmlDirectory(distDir: string, options?: ScanOptions): Promise<ScanResult>;
//# sourceMappingURL=scanner.d.ts.map