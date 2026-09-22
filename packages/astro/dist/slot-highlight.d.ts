/**
 * Universal Slot Highlighting Controller for SlotWire
 * Provides keyboard shortcuts (Alt+S), persistent highlight states, and visual outline overlays.
 * Elevated z-index (z: 25) ensures outlines render cleanly over section dividers (z: 10).
 */
export declare function isDevOrPreview(): boolean;
export declare function getInitialHighlightState(): boolean;
export declare function syncStaticSlotBadges(active: boolean): void;
export declare function setSlotHighlight(active: boolean): void;
export declare function injectHighlightStyles(): void;
export declare function setupHighlightKeyboardShortcut(): void;
export declare function initSlotHighlight(): void;
//# sourceMappingURL=slot-highlight.d.ts.map