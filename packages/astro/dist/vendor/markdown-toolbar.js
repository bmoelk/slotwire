/**
 * SlotWire Markdown Toolbar Custom Element
 * Inspired by @github/markdown-toolbar-element with native Undo/Redo (Cmd+Z) preservation.
 */
function insertText(textarea, before, after = '', multiline = false) {
    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.slice(start, end);
    let replacement = '';
    let newStart = start;
    let newEnd = end;
    if (multiline && selected.includes('\n')) {
        // Multiline line-prefix wrapping (e.g. lists, blockquotes)
        const lines = selected.split('\n');
        replacement = lines.map((line) => `${before}${line}${after}`).join('\n');
        newStart = start;
        newEnd = start + replacement.length;
    }
    else {
        replacement = `${before}${selected}${after}`;
        if (start === end) {
            newStart = start + before.length;
            newEnd = newStart;
        }
        else {
            newStart = start;
            newEnd = start + replacement.length;
        }
    }
    // Preserve native browser Undo buffer (Cmd+Z) via execCommand or setRangeText
    let success = false;
    try {
        success = document.execCommand('insertText', false, replacement);
    }
    catch {
        success = false;
    }
    if (!success) {
        textarea.setRangeText(replacement, start, end, 'select');
    }
    textarea.setSelectionRange(newStart, newEnd);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
}
const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {
};
export class MarkdownToolbarElement extends BaseElement {
    connectedCallback() {
        this.addEventListener('click', this.handleClick.bind(this));
        this.setupShortcuts();
    }
    getTextarea() {
        const forId = this.getAttribute('for');
        if (forId) {
            const el = document.getElementById(forId);
            if (el instanceof HTMLTextAreaElement)
                return el;
        }
        // Sibling or parent search fallback
        const parent = this.closest('.sw-field-group, .editor-container-wrapper, form, div');
        if (parent) {
            const ta = parent.querySelector('textarea');
            if (ta instanceof HTMLTextAreaElement)
                return ta;
        }
        return null;
    }
    setupShortcuts() {
        const textarea = this.getTextarea();
        if (!textarea)
            return;
        textarea.addEventListener('keydown', (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const mod = isMac ? e.metaKey : e.ctrlKey;
            if (!mod)
                return;
            if (e.key.toLowerCase() === 'b') {
                e.preventDefault();
                insertText(textarea, '**', '**');
            }
            else if (e.key.toLowerCase() === 'i') {
                e.preventDefault();
                insertText(textarea, '*', '*');
            }
            else if (e.key.toLowerCase() === 'k') {
                e.preventDefault();
                insertLink(textarea);
            }
        });
    }
    handleClick(event) {
        const target = event.target.closest('button, [data-md-action]');
        if (!target)
            return;
        const textarea = this.getTextarea();
        if (!textarea)
            return;
        event.preventDefault();
        const action = target.getAttribute('data-md-action') || target.tagName.toLowerCase().replace('md-', '');
        switch (action) {
            case 'bold':
                insertText(textarea, '**', '**');
                break;
            case 'italic':
                insertText(textarea, '*', '*');
                break;
            case 'header':
            case 'h3': {
                const level = target.getAttribute('data-level') || '3';
                const prefix = `${'#'.repeat(Number(level))} `;
                insertText(textarea, prefix, '', true);
                break;
            }
            case 'quote':
                insertText(textarea, '> ', '', true);
                break;
            case 'code':
                if (textarea.selectionStart !== textarea.selectionEnd && textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).includes('\n')) {
                    insertText(textarea, '```\n', '\n```');
                }
                else {
                    insertText(textarea, '`', '`');
                }
                break;
            case 'link':
                insertLink(textarea);
                break;
            case 'unordered-list':
            case 'list':
                insertText(textarea, '- ', '', true);
                break;
            case 'ordered-list':
                insertText(textarea, '1. ', '', true);
                break;
        }
    }
}
function insertLink(textarea) {
    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || 'link text';
    const url = 'https://example.com';
    const replacement = `[${selected}](${url})`;
    insertText(textarea, `[${selected}](`, ')');
    // Highlight url portion for quick typing
    const urlStart = start + selected.length + 3;
    const urlEnd = urlStart + url.length;
    textarea.setSelectionRange(urlStart, urlEnd);
}
if (typeof customElements !== 'undefined' && !customElements.get('markdown-toolbar')) {
    customElements.define('markdown-toolbar', MarkdownToolbarElement);
}
//# sourceMappingURL=markdown-toolbar.js.map