/**
 * Pell Micro-WYSIWYG Editor
 * Featherweight HTML fragment editor (~1.38 KB gzipped) with native Undo/Redo (Cmd+Z).
 * Recommended for WordPress and HTML-based headless CMS workflows.
 */
const defaultParagraphSeparatorString = 'defaultParagraphSeparator';
const formatBlock = 'formatBlock';
export function exec(command, value = null) {
    return document.execCommand(command, false, value);
}
export function queryCommandState(command) {
    return document.queryCommandState(command);
}
export const defaultActions = {
    bold: {
        name: 'bold',
        icon: '<b>B</b>',
        title: 'Bold (Cmd+B)',
        result: () => exec('bold'),
    },
    italic: {
        name: 'italic',
        icon: '<i>I</i>',
        title: 'Italic (Cmd+I)',
        result: () => exec('italic'),
    },
    underline: {
        name: 'underline',
        icon: '<u>U</u>',
        title: 'Underline (Cmd+U)',
        result: () => exec('underline'),
    },
    heading2: {
        name: 'heading2',
        icon: '<b>H2</b>',
        title: 'Heading 2',
        result: () => exec(formatBlock, '<h2>'),
    },
    heading3: {
        name: 'heading3',
        icon: '<b>H3</b>',
        title: 'Heading 3',
        result: () => exec(formatBlock, '<h3>'),
    },
    paragraph: {
        name: 'paragraph',
        icon: '¶',
        title: 'Paragraph',
        result: () => exec(formatBlock, '<p>'),
    },
    quote: {
        name: 'quote',
        icon: '“',
        title: 'Quote',
        result: () => exec(formatBlock, '<blockquote>'),
    },
    olist: {
        name: 'olist',
        icon: '1≡',
        title: 'Numbered List',
        result: () => exec('insertOrderedList'),
    },
    ulist: {
        name: 'ulist',
        icon: '•≡',
        title: 'Bullet List',
        result: () => exec('insertUnorderedList'),
    },
    link: {
        name: 'link',
        icon: '🔗',
        title: 'Link (Cmd+K)',
        result: () => {
            const url = window.prompt('Enter link URL:');
            if (url)
                exec('createLink', url);
        },
    },
};
export function initPell(options) {
    const { element, onChange, defaultParagraphSeparator = 'p', styleWithCSS = false, actions = [
        'bold',
        'italic',
        'underline',
        'heading2',
        'heading3',
        'olist',
        'ulist',
        'quote',
        'link',
    ], initialHtml = '', } = options;
    element.innerHTML = '';
    element.classList.add('pell-container');
    // Toolbar
    const actionbar = document.createElement('div');
    actionbar.className = 'pell-actionbar flex flex-wrap items-center gap-1 border border-b-0 border-zinc-700 rounded-t-md bg-zinc-900 px-2 py-1 text-zinc-400';
    element.appendChild(actionbar);
    // ContentEditable Area
    const content = document.createElement('div');
    content.contentEditable = 'true';
    content.className = 'pell-content w-full rounded-b-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[140px] overflow-y-auto';
    content.innerHTML = initialHtml;
    element.appendChild(content);
    // Input & Change listener
    content.oninput = ({ target }) => {
        const firstChild = target.firstChild;
        if (firstChild && firstChild.nodeType === 3) {
            exec(formatBlock, `<${defaultParagraphSeparator}>`);
        }
        else if (content.innerHTML === '<br>') {
            content.innerHTML = '';
        }
        onChange(content.innerHTML);
    };
    // Keyboard Shortcuts (Cmd+B, Cmd+I, Cmd+U, Cmd+K)
    content.onkeydown = (event) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const mod = isMac ? event.metaKey : event.ctrlKey;
        if (mod) {
            if (event.key.toLowerCase() === 'b') {
                event.preventDefault();
                exec('bold');
                onChange(content.innerHTML);
            }
            else if (event.key.toLowerCase() === 'i') {
                event.preventDefault();
                exec('italic');
                onChange(content.innerHTML);
            }
            else if (event.key.toLowerCase() === 'u') {
                event.preventDefault();
                exec('underline');
                onChange(content.innerHTML);
            }
            else if (event.key.toLowerCase() === 'k') {
                event.preventDefault();
                const url = window.prompt('Enter link URL:');
                if (url) {
                    exec('createLink', url);
                    onChange(content.innerHTML);
                }
            }
        }
        if (event.key === 'Enter' && document.queryCommandValue(formatBlock) === 'blockquote') {
            setTimeout(() => exec(formatBlock, `<${defaultParagraphSeparator}>`), 0);
        }
    };
    // Populate action bar buttons
    actions.forEach((action) => {
        const act = typeof action === 'string' ? defaultActions[action] : action;
        if (!act)
            return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pell-button rounded px-1.5 py-0.5 text-xs font-semibold hover:bg-zinc-800 hover:text-white transition-colors';
        button.innerHTML = act.icon;
        button.title = act.title;
        button.setAttribute('aria-label', act.title);
        button.onclick = (e) => {
            e.preventDefault();
            content.focus();
            act.result();
            onChange(content.innerHTML);
        };
        actionbar.appendChild(button);
    });
    if (styleWithCSS)
        exec('styleWithCSS');
    exec(defaultParagraphSeparatorString, defaultParagraphSeparator);
    return {
        content,
        setHtml: (html) => {
            content.innerHTML = html;
            onChange(content.innerHTML);
        },
        getHtml: () => content.innerHTML,
    };
}
//# sourceMappingURL=pell.js.map