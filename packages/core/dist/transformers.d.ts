/**
 * SlotWire Reusable Transformer Toolkit (`tx`)
 *
 * A collection of pure functional building blocks for extracting, sanitizing,
 * and mapping headless CMS / Divi / Gutenberg / HTML content payloads into
 * strongly-typed SlotWire schema contracts.
 */
export interface ButtonExtraction {
    text: string;
    url: string;
}
/**
 * Decodes common HTML entities
 */
export declare function decodeEntities(str: string): string;
/**
 * Strips Divi builder, Visual Composer, and generic shortcodes while preserving inner text
 */
export declare function cleanShortcodes(raw: string): string;
/**
 * Strips HTML tags and normalizes whitespace
 */
export declare function stripHtml(html: string): string;
/**
 * Extracts the first regex match or capture group
 */
export declare function extractFirst(pattern: RegExp, text: string, group?: number): string | null;
/**
 * Extracts all regex matches or capture groups
 */
export declare function extractAll(pattern: RegExp, text: string, group?: number): string[];
/**
 * Extracts all image URLs found in an HTML or shortcode string
 */
export declare function extractImages(raw: string): string[];
/**
 * Extracts heading text by tag name (e.g. 'h1', 'h2')
 */
export declare function extractHeading(raw: string, tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'): string | null;
/**
 * Extracts button text and URL from Divi shortcode `[et_pb_button ...]` or HTML `<a>`
 */
export declare function extractButton(raw: string): ButtonExtraction | null;
/**
 * Splits content into clean text paragraphs
 */
export declare function extractParagraphs(raw: string, minLength?: number): string[];
/**
 * Plucks a specific property from an array of objects
 */
export declare function pluck<T extends Record<string, any>, K extends keyof T>(items: T[], key: K): Array<T[K]>;
/**
 * Grouped `tx` namespace for concise import and usage:
 * `import { tx } from '@slotwire/core';`
 */
export declare const tx: {
    decodeEntities: typeof decodeEntities;
    cleanShortcodes: typeof cleanShortcodes;
    stripHtml: typeof stripHtml;
    extractFirst: typeof extractFirst;
    extractAll: typeof extractAll;
    extractImages: typeof extractImages;
    extractHeading: typeof extractHeading;
    extractButton: typeof extractButton;
    extractParagraphs: typeof extractParagraphs;
    pluck: typeof pluck;
};
//# sourceMappingURL=transformers.d.ts.map