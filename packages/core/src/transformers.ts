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
export function decodeEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Strips Divi builder, Visual Composer, and generic shortcodes while preserving inner text
 */
export function cleanShortcodes(raw: string): string {
  if (!raw) return '';
  return decodeEntities(
    raw
      .replace(/\[\/?et_pb_[^\]]*\]/g, ' ')
      .replace(/\[\/?wpforms[^\]]*\]/g, ' ')
      .replace(/\[\/?vc_[^\]]*\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Strips HTML tags and normalizes whitespace
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  const clean = html.replace(/<[^>]+>/g, ' ');
  return decodeEntities(clean).replace(/\s+/g, ' ').trim();
}

/**
 * Extracts the first regex match or capture group
 */
export function extractFirst(pattern: RegExp, text: string, group = 1): string | null {
  if (!text) return null;
  const match = text.match(pattern);
  if (!match) return null;
  return (match[group] !== undefined ? match[group] : match[0]).trim();
}

/**
 * Extracts all regex matches or capture groups
 */
export function extractAll(pattern: RegExp, text: string, group = 1): string[] {
  if (!text) return [];
  const results: string[] = [];
  const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const val = match[group] !== undefined ? match[group] : match[0];
    if (val) results.push(val.trim());
  }
  return results;
}

/**
 * Extracts all image URLs found in an HTML or shortcode string
 */
export function extractImages(raw: string): string[] {
  if (!raw) return [];
  const matches = raw.match(/https?:\/\/[^\s"'<>\\]+\.(?:jpg|jpeg|png|svg|webp|gif)/gi) || [];
  return Array.from(new Set(matches));
}

/**
 * Extracts heading text by tag name (e.g. 'h1', 'h2')
 */
export function extractHeading(
  raw: string,
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h1'
): string | null {
  if (!raw) return null;
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'is');
  const match = raw.match(regex);
  return match ? stripHtml(match[1]) : null;
}

/**
 * Extracts button text and URL from Divi shortcode `[et_pb_button ...]` or HTML `<a>`
 */
export function extractButton(raw: string): ButtonExtraction | null {
  if (!raw) return null;
  // Divi shortcode pattern
  const btnUrlMatch = raw.match(/button_url=["']?([^"'\s\]]+)/i);
  const btnTextMatch = raw.match(/button_text=["']?([^"'\s\]]+(?: [^"'\s\]]+)*)/i);
  if (btnUrlMatch && btnTextMatch) {
    return {
      url: decodeEntities(btnUrlMatch[1]),
      text: decodeEntities(btnTextMatch[1]),
    };
  }
  // HTML link pattern
  const aMatch = raw.match(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);
  if (aMatch) {
    return {
      url: decodeEntities(aMatch[1]),
      text: stripHtml(aMatch[2]),
    };
  }
  return null;
}

/**
 * Splits content into clean text paragraphs
 */
export function extractParagraphs(raw: string, minLength = 30): string[] {
  if (!raw) return [];
  const clean = raw
    .replace(/\[\/?et_pb_[^\]]*\]/g, '\n---P---\n')
    .replace(/<\/p>/gi, '\n---P---\n');
  return clean
    .split('\n---P---\n')
    .map((p) => stripHtml(p))
    .filter((p) => p.length >= minLength);
}

/**
 * Plucks a specific property from an array of objects
 */
export function pluck<T extends Record<string, any>, K extends keyof T>(
  items: T[],
  key: K
): Array<T[K]> {
  return (items || []).map((item) => item[key]);
}

/**
 * Grouped `tx` namespace for concise import and usage:
 * `import { tx } from '@slotwire/core';`
 */
export const tx = {
  decodeEntities,
  cleanShortcodes,
  stripHtml,
  extractFirst,
  extractAll,
  extractImages,
  extractHeading,
  extractButton,
  extractParagraphs,
  pluck,
};
