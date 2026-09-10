import { INSPECTOR_CSS, renderInspectorHtml, initInspector, startVisualElementPicker } from './inspector-core.js';

const toolbarApp: any = {
  init(canvas: any, app: any, server: any) {
    function renderApp() {
      canvas.innerHTML = '';

      const windowElement = document.createElement('astro-dev-toolbar-window');
      windowElement.setAttribute('placement', 'bottom-center');
      windowElement.style.cssText = `
        width: 440px !important;
        max-width: calc(100vw - 32px) !important;
        max-height: calc(100vh - 100px) !important;
        height: auto !important;
        padding: 0 !important;
        background: #09090b !important;
        border: 1px solid #27272a !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.85) !important;
        overflow: hidden !important;
        color-scheme: dark !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        bottom: 72px !important;
        margin: 0 auto !important;
      `;
      windowElement.innerHTML = `
        <style>
          .sw-inspector {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 14px !important;
          }
          ${INSPECTOR_CSS}
        </style>
        ${renderInspectorHtml({
          adminUrl: '/admin',
          envTag: 'DEV',
          provider: 'slottd',
          showCloseBtn: false,
          showRequestSlotBtn: true,
        })}
      `;

      canvas.appendChild(windowElement);

      initInspector(windowElement, {
        adminUrl: '/admin',
        envTag: 'DEV',
        provider: 'slottd',
        showRequestSlotBtn: true,
        onRequestSlot: () => {
          // 1. Dispatch official toggle-app event to close Astro toolbar
          if (app && app.dispatchEvent) {
            app.dispatchEvent(new CustomEvent('toggle-app', { detail: { state: false } }));
          }
          if (app && app.toggleState) {
            try {
              app.toggleState(false);
            } catch {
              // ignore
            }
          }
          // 2. Hide shadow root canvas immediately
          const tbWindow = canvas.querySelector('astro-dev-toolbar-window');
          if (tbWindow) tbWindow.style.display = 'none';
          if (canvas.host) (canvas.host as HTMLElement).style.display = 'none';

          // 3. Directly launch Visual Element Picker
          startVisualElementPicker(() => {
            if (tbWindow) tbWindow.style.display = '';
            if (canvas.host) (canvas.host as HTMLElement).style.display = '';
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
      app.onToggled(({ state }: any) => {
        if (state) {
          renderApp();
        }
      });
    }
  },
};

export default toolbarApp;

