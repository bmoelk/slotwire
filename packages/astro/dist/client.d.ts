import type { SlotWireConfig } from '@slotwire/core';
import './vendor/markdown-toolbar.js';
export declare class SlotWireClient {
    private config;
    constructor(config: SlotWireConfig);
    getCollection<T = any>(collectionName: string): Promise<T[]>;
    getSection<T = any>(sectionSlug: string): Promise<T | null>;
}
export declare function createSlotWireClient(config: SlotWireConfig): SlotWireClient;
export interface IntrospectedSlotChildItem {
    id: string;
    label: string;
    editUrl?: string;
}
export interface IntrospectedSlot {
    slot: string;
    archetype?: string;
    collection?: string;
    pageSlug?: string;
    sectionKey?: string;
    documentId?: string;
    items?: IntrospectedSlotChildItem[];
    isGhost: boolean;
    element: HTMLElement;
}
/**
 * Scans the current DOM for all active SlotWire slots and ghost wireframes.
 */
export declare function introspectPageSlots(): IntrospectedSlot[];
/**
 * Initializes the in-situ preview workbench:
 * - Collapsible HUD Checklist Drawer
 * - 1-Click Smooth Scroll to Canvas elements
 * - Pre-Create Page Blueprint Cloner
 * - Live EventStream / SSE Slot Morphing
 */
export declare function initSlotWirePreview(options?: {
    adminUrl?: string;
    provider?: string;
    editor?: 'markdown' | 'html';
}): void;
export interface QuickEditDrawerParams {
    slot: string;
    collection?: string;
    documentId?: string;
    data?: any;
    editUrl?: string;
    slotElement?: HTMLElement | null;
    itemIndex?: number;
    itemSlug?: string;
    itemTitle?: string;
}
export interface SlotWireAuthUser {
    email: string;
    name?: string;
    provider?: string;
}
export declare const SlotWireAuthManager: {
    getStorageKey(apiUrl: string): string;
    getToken(apiUrl: string): string | null;
    getUser(apiUrl: string): SlotWireAuthUser | null;
    setAuth(apiUrl: string, token: string, user: SlotWireAuthUser): void;
    clearAuth(apiUrl: string): void;
    checkAuth(apiUrl: string, provider: string): Promise<{
        authenticated: boolean;
        user?: SlotWireAuthUser;
    }>;
    openAuthPopup(apiUrl: string, provider: string): Promise<{
        token: string;
        user: SlotWireAuthUser;
    }>;
};
/**
 * Initializes the 80/20 in-situ Quick Edit slide-over drawer:
 * - Direct on-page form editing without jumping to the full CMS studio
 * - Featherweight GitHub Markdown Toolbar (<markdown-toolbar>) with native Cmd+Z undo preservation
 * - Live [Write | Preview] tab switcher
 * - Direct mutation dispatcher to POST /api/slotwire/quick-save
 * - Zero-latency optimistic DOM update on save
 */
export declare function initQuickEditDrawer(options?: {
    adminUrl?: string;
    apiUrl?: string;
    provider?: string;
    editor?: 'markdown' | 'html';
}): {
    open: (params: QuickEditDrawerParams) => void;
    close: () => void;
    refreshSlot: typeof refreshSlot;
    refreshAllSlots: typeof refreshAllSlots;
} | undefined;
/**
 * In-Situ Manual Slot Refresh (No Page Reload)
 * Fetches fresh SSR markup from the server and swaps slot content in-place with an emerald pulse.
 */
export declare function refreshSlot(slotName: string): Promise<boolean>;
/**
 * In-Situ Refresh for All Slots on the Page
 */
export declare function refreshAllSlots(): Promise<void>;
/**
 * Live Slot Morphing helper using document.startViewTransition
 */
export declare function morphSlotElement(slotKey: string, newHtml: string): Promise<boolean>;
//# sourceMappingURL=client.d.ts.map