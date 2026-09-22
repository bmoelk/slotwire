/**
 * Pell Micro-WYSIWYG Editor
 * Featherweight HTML fragment editor (~1.38 KB gzipped) with native Undo/Redo (Cmd+Z).
 * Recommended for WordPress and HTML-based headless CMS workflows.
 */
export interface PellAction {
    name: string;
    icon: string;
    title: string;
    result: () => void;
    state?: () => boolean;
}
export interface PellOptions {
    element: HTMLElement;
    onChange: (html: string) => void;
    defaultParagraphSeparator?: string;
    styleWithCSS?: boolean;
    actions?: (string | PellAction)[];
    initialHtml?: string;
}
export interface PellEditorInstance {
    content: HTMLDivElement;
    setHtml: (html: string) => void;
    getHtml: () => string;
}
export declare function exec(command: string, value?: string | null): boolean;
export declare function queryCommandState(command: string): boolean;
export declare const defaultActions: Record<string, PellAction>;
export declare function initPell(options: PellOptions): PellEditorInstance;
//# sourceMappingURL=pell.d.ts.map