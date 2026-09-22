/**
 * SlotWire Markdown Toolbar Custom Element
 * Inspired by @github/markdown-toolbar-element with native Undo/Redo (Cmd+Z) preservation.
 */
declare const BaseElement: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export declare class MarkdownToolbarElement extends BaseElement {
    connectedCallback(): void;
    getTextarea(): HTMLTextAreaElement | null;
    private setupShortcuts;
    private handleClick;
}
export {};
//# sourceMappingURL=markdown-toolbar.d.ts.map