import { INSPECTOR_CSS, renderInspectorHtml, initInspector, startVisualElementPicker } from './inspector-core.js';
const toolbarApp = {
    init(canvas, app, server) {
        function renderApp() {
            canvas.innerHTML = '';
            const canvasStyle = document.createElement('style');
            canvasStyle.textContent = `
        astro-dev-toolbar-window {
          position: fixed !important;
          left: 50% !important;
          right: auto !important;
          top: auto !important;
          bottom: 72px !important;
          transform: translateX(-50%) !important;
          width: 480px !important;
          max-width: calc(100vw - 32px) !important;
          max-height: calc(100vh - 100px) !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          overflow: visible !important;
        }
      `;
            canvas.appendChild(canvasStyle);
            const windowElement = document.createElement('astro-dev-toolbar-window');
            windowElement.setAttribute('placement', 'bottom-center');
            windowElement.style.cssText = `
        position: fixed !important;
        left: 50% !important;
        right: auto !important;
        top: auto !important;
        bottom: 72px !important;
        transform: translateX(-50%) !important;
        width: 480px !important;
        max-width: calc(100vw - 32px) !important;
        max-height: calc(100vh - 100px) !important;
        height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        overflow: visible !important;
      `;
            windowElement.innerHTML = `
        <style>
          ${INSPECTOR_CSS}
          .sw-inspector {
            width: 480px !important;
            max-width: calc(100vw - 32px) !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
          }
        </style>
        ${(() => {
                const globalConfig = globalThis.__SLOTWIRE_CONFIG__;
                const resolvedProvider = (typeof process !== 'undefined' && (process.env?.CMS_PROVIDER || process.env?.PUBLIC_CMS_PROVIDER)) ||
                    globalConfig?.cms?.provider ||
                    'cms';
                return renderInspectorHtml({
                    adminUrl: '/admin',
                    envTag: 'DEV',
                    provider: resolvedProvider,
                    showCloseBtn: false,
                    showRequestSlotBtn: true,
                });
            })()}
      `;
            canvas.appendChild(windowElement);
            // Defensively strip Astro's default 24px padding, gradient background, border, and restrictive 480px max-height from the Shadow DOM
            if (windowElement.shadowRoot) {
                const shadowOverride = document.createElement('style');
                shadowOverride.textContent = `
          :host {
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            width: 480px !important;
            max-width: calc(100vw - 32px) !important;
            max-height: calc(100vh - 100px) !important;
            overflow: visible !important;
          }
        `;
                windowElement.shadowRoot.appendChild(shadowOverride);
            }
            const globalConfig = globalThis.__SLOTWIRE_CONFIG__;
            const resolvedProvider = (typeof process !== 'undefined' && (process.env?.CMS_PROVIDER || process.env?.PUBLIC_CMS_PROVIDER)) ||
                globalConfig?.cms?.provider ||
                'cms';
            initInspector(windowElement, {
                adminUrl: '/admin',
                envTag: 'DEV',
                provider: resolvedProvider,
                showRequestSlotBtn: true,
                onRequestSlot: () => {
                    // 1. Dispatch official toggle-app event to close Astro toolbar
                    if (app && app.dispatchEvent) {
                        app.dispatchEvent(new CustomEvent('toggle-app', { detail: { state: false } }));
                    }
                    if (app && app.toggleState) {
                        try {
                            app.toggleState(false);
                        }
                        catch {
                            // ignore
                        }
                    }
                    // 2. Hide shadow root canvas immediately
                    const tbWindow = canvas.querySelector('astro-dev-toolbar-window');
                    if (tbWindow)
                        tbWindow.style.display = 'none';
                    if (canvas.host)
                        canvas.host.style.display = 'none';
                    // 3. Directly launch Visual Element Picker
                    startVisualElementPicker(() => {
                        if (tbWindow)
                            tbWindow.style.display = '';
                        if (canvas.host)
                            canvas.host.style.display = '';
                    });
                },
            });
        }
        // Initial render
        renderApp();
        // Re-render and sync on Astro View Transitions client navigation
        const syncAndRender = () => {
            renderApp();
        };
        document.addEventListener('astro:page-load', syncAndRender);
        document.addEventListener('astro:after-swap', syncAndRender);
        // Re-render when toolbar is toggled open
        if (app && app.onToggled) {
            app.onToggled(({ state }) => {
                if (state) {
                    renderApp();
                }
            });
        }
    },
};
export default toolbarApp;
//# sourceMappingURL=toolbar.js.map