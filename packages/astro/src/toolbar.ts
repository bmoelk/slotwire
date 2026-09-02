const SLOT_ARCHETYPES = [
  { id: 'page', name: 'page (Full Page Archetype)' },
  { id: 'section', name: 'section (Layout Container)' },
  { id: 'cards', name: 'cards (Multi-Column Grid)' },
  { id: 'gallery', name: 'gallery (Media & Image Array)' },
  { id: 'endorsements', name: 'endorsements (Quotes & Social Proof)' },
  { id: 'testimonials', name: 'testimonials (Customer Reviews)' },
  { id: 'qa', name: 'qa (Questions & Answers / FAQ)' },
  { id: 'table', name: 'table (Tabular Data)' },
  { id: 'timeline', name: 'timeline (Sequential Events)' },
  { id: 'stats', name: 'stats (Numeric Counters)' },
  { id: 'singleton', name: 'singleton (Global Settings)' },
];

let isHighlightActive = false;
let areWireframesVisible = typeof window !== 'undefined' ? sessionStorage.getItem('slotwire_hide_overlays') !== 'true' : true;

const toolbarApp: any = {
  init(canvas: any, app: any, server: any) {
    function renderApp() {
      canvas.innerHTML = '';

      const windowElement = document.createElement('astro-dev-toolbar-window');
      windowElement.innerHTML = `
        <style>
          :host astro-dev-toolbar-window {
            width: 430px;
            max-width: calc(100vw - 32px);
            max-height: 540px;
            overflow-y: auto;
            color-scheme: dark;
            border-radius: 12px;
            border: 1px solid #27272a;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.7), 0 8px 10px -6px rgba(0,0,0,0.7);
          }
          .sw-toolbar {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #09090b;
            color: #f4f4f5;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-sizing: border-box;
          }
          .sw-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #27272a;
            padding-bottom: 10px;
          }
          .sw-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 14px;
            color: #fafafa;
          }
          .sw-header-actions {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .sw-cms-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 11px;
            color: #a1a1aa;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 6px;
            padding: 6px 10px;
          }
          .sw-cms-info strong {
            color: #34d399;
          }
          .sw-progress-wrap {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .sw-progress-bar {
            width: 100%;
            height: 8px;
            background: #27272a;
            border-radius: 9999px;
            overflow: hidden;
          }
          .sw-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #059669, #10b981);
            border-radius: 9999px;
            transition: width 0.3s ease;
          }
          .sw-slot-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-height: 220px;
            overflow-y: auto;
            padding-right: 4px;
          }
          .sw-slot-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 12px;
            transition: border-color 0.15s ease;
          }
          .sw-slot-item:hover {
            border-color: #10b981;
          }
          .sw-btn {
            background: #27272a;
            color: #f4f4f5;
            border: 1px solid #3f3f46;
            border-radius: 6px;
            padding: 5px 9px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .sw-btn:hover {
            background: #3f3f46;
            color: #ffffff;
          }
          .sw-btn-active {
            background: #065f46 !important;
            border-color: #10b981 !important;
            color: #34d399 !important;
          }
          .sw-btn-cms {
            background: #059669;
            border-color: #10b981;
            color: #ffffff;
          }
          .sw-btn-cms:hover {
            background: #10b981;
          }
          .sw-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            border-top: 1px solid #27272a;
            padding-top: 10px;
          }
        </style>
        <div class="sw-toolbar">
          <div class="sw-header">
            <div class="sw-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#10b981" stroke-width="1.8"/>
                <rect x="16" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#06b6d4" stroke-width="1.8"/>
                <circle cx="5" cy="8.5" r="1.2" fill="#10b981"/>
                <circle cx="5" cy="15.5" r="1.2" fill="#10b981"/>
                <circle cx="19" cy="8.5" r="1.2" fill="#06b6d4"/>
                <circle cx="19" cy="15.5" r="1.2" fill="#06b6d4"/>
                <path d="M6.5 8.5H17.5" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M6.5 15.5H17.5" stroke="#06b6d4" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              SlotWire Inspector
            </div>
            <div class="sw-header-actions">
              <button id="sw-tb-toggle-wireframes" class="sw-btn ${areWireframesVisible ? '' : 'sw-btn-active'}" title="Toggle wireframes to view clean site without outlines">
                ${areWireframesVisible ? '👁️ Overlays: ON' : '🙈 Overlays: OFF'}
              </button>
              <button id="sw-tb-rescan" class="sw-btn" title="Rescan page DOM">↻</button>
            </div>
          </div>

          <div class="sw-cms-info">
            <span>Configured CMS:</span>
            <a href="/admin" target="_blank" style="color:#34d399; text-decoration:none; font-weight:600;">CMS Studio ↗</a>
          </div>

          <div class="sw-progress-wrap">
            <div style="display:flex; justify-content:space-between; font-family:monospace; font-size:11px;">
              <span>Completeness:</span>
              <span id="sw-tb-pct" style="font-weight:bold; color:#10b981;">0%</span>
            </div>
            <div class="sw-progress-bar">
              <div id="sw-tb-progress" class="sw-progress-fill" style="width: 0%;"></div>
            </div>
          </div>

          <div id="sw-tb-list" class="sw-slot-list">
            <div style="text-align:center; padding:12px; color:#71717a;">Auditing page slots...</div>
          </div>

          <div class="sw-footer">
            <button id="sw-tb-highlight-all" class="sw-btn ${isHighlightActive ? 'sw-btn-active' : ''}">
              ${isHighlightActive ? '✕ Clear Highlights' : '📍 Highlight All'}
            </button>
            <button id="sw-tb-request-slot" class="sw-btn" title="Visually select an element on the page and create a slot ticket">
              🎯 Request Slot
            </button>
            <a href="/admin" target="_blank" class="sw-btn sw-btn-cms" style="text-decoration:none;">
              CMS Studio ↗
            </a>
          </div>
        </div>
      `;

      canvas.appendChild(windowElement);

      // Perform scan and render slot list
      const slotElements = document.querySelectorAll<HTMLElement>(
        '[data-slotwire-slot], .slotwire-ghost-slot, .slotwire-ghost-card'
      );
      const totalSlots = slotElements.length;
      let ghostSlots = 0;

      const items: Array<{
        slot: string;
        collection?: string;
        source?: string;
        isGhost: boolean;
        hasFallback: boolean;
        element: HTMLElement;
      }> = [];

      slotElements.forEach((el) => {
        const isGhost =
          el.hasAttribute('data-slotwire-ghost') ||
          el.classList.contains('slotwire-ghost-slot') ||
          el.classList.contains('slotwire-ghost-card');
        if (isGhost) ghostSlots++;

        const hasFallback =
          el.getAttribute('data-slotwire-has-fallback') === 'true' ||
          el.getAttribute('data-slotwire-source') === 'fallback';

        items.push({
          slot: el.getAttribute('data-slotwire-slot') || '',
          collection: el.getAttribute('data-slotwire-collection') || undefined,
          source: el.getAttribute('data-slotwire-source') || (isGhost ? 'ghost' : 'cms'),
          isGhost,
          hasFallback,
          element: el,
        });
      });

      const populatedSlots = totalSlots - ghostSlots;
      const pct = totalSlots > 0 ? Math.round((populatedSlots / totalSlots) * 100) : 100;

      // Update progress
      const pctEl = windowElement.querySelector('#sw-tb-pct');
      const progressEl = windowElement.querySelector<HTMLElement>('#sw-tb-progress');
      if (pctEl) pctEl.textContent = `${pct}% (${populatedSlots}/${totalSlots})`;
      if (progressEl) progressEl.style.width = `${pct}%`;

      // Update list
      const listEl = windowElement.querySelector('#sw-tb-list');
      if (listEl) {
        if (items.length === 0) {
          listEl.innerHTML =
            '<div style="text-align:center; padding:16px; color:#71717a;">No &lt;SlotWire /&gt; declarations on this route.</div>';
        } else {
          listEl.innerHTML = items
            .map((item, idx) => {
              let statusBadge = '<span style="color:#10b981; font-weight:bold;">[✓ Live CMS]</span>';
              if (item.isGhost) {
                if (item.hasFallback) {
                  statusBadge = '<span style="color:#fbbf24; font-weight:bold;">[⚠️ Ghost (Fallback)]</span>';
                } else {
                  statusBadge = '<span style="color:#fca5a5; font-weight:bold;">[✖ Ghost (Blank)]</span>';
                }
              } else if (item.source === 'fallback') {
                statusBadge = '<span style="color:#fbbf24; font-weight:bold;">[⚠️ Template Fallback]</span>';
              }

              return `
              <div class="sw-slot-item">
                <div style="overflow:hidden; flex:1;">
                  <div style="font-family:monospace; font-weight:bold; color:#f4f4f5; text-overflow:ellipsis; overflow:hidden;">${item.slot}</div>
                  <div style="font-size:10px; color:#a1a1aa; margin-top:2px;">${statusBadge} ${item.collection ? `• ${item.collection}` : ''}</div>
                </div>
                <div style="display:flex; gap:4px;">
                  <button class="sw-btn sw-locate-btn" data-slot-idx="${idx}">📍 Locate</button>
                </div>
              </div>`;
            })
            .join('');

          // Attach click handlers
          listEl.querySelectorAll('.sw-locate-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
              const idx = parseInt((e.target as HTMLElement).getAttribute('data-slot-idx') || '0', 10);
              const targetItem = items[idx];
              if (targetItem && targetItem.element) {
                targetItem.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                const prevOutline = targetItem.element.style.outline;
                targetItem.element.style.outline = '4px solid #10b981';
                targetItem.element.style.outlineOffset = '4px';

                setTimeout(() => {
                  targetItem.element.style.outline = prevOutline;
                }, 2500);
              }
            });
          });
        }
      }

      // Attach rescan button
      windowElement.querySelector('#sw-tb-rescan')?.addEventListener('click', () => {
        renderApp();
      });

      // Attach Wireframes / Overlays Toggle (Preserves Clean Fallback Content)
      windowElement.querySelector('#sw-tb-toggle-wireframes')?.addEventListener('click', () => {
        areWireframesVisible = !areWireframesVisible;
        if (!areWireframesVisible) {
          document.documentElement.classList.add('slotwire-hide-overlays');
          if (!document.getElementById('sw-hide-style')) {
            const style = document.createElement('style');
            style.id = 'sw-hide-style';
            style.textContent = `
              .slotwire-hide-overlays .slotwire-ghost-card {
                border: none !important;
                background: transparent !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
              }
              .slotwire-hide-overlays .sw-ghost-header,
              .slotwire-hide-overlays .sw-ghost-context-row,
              .slotwire-hide-overlays .sw-ghost-explainer-box,
              .slotwire-hide-overlays .slotwire-in-situ-badge,
              .slotwire-hide-overlays .slotwire-composite-popover {
                display: none !important;
              }
              .slotwire-hide-overlays .sw-ghost-fallback {
                border-top: none !important;
                margin-top: 0 !important;
                padding-top: 0 !important;
                opacity: 1 !important;
              }
              .slotwire-hide-overlays .slotwire-slot-container {
                outline: none !important;
              }
              .slotwire-hide-overlays .slotwire-ghost-card[data-slotwire-has-fallback="false"] {
                display: none !important;
              }
            `;
            document.head.appendChild(style);
          }
          sessionStorage.setItem('slotwire_hide_overlays', 'true');
        } else {
          document.documentElement.classList.remove('slotwire-hide-overlays');
          document.getElementById('sw-hide-style')?.remove();
          sessionStorage.setItem('slotwire_hide_overlays', 'false');
        }
        renderApp();
      });

      // Attach Highlight All Toggle (with Untoggle support)
      windowElement.querySelector('#sw-tb-highlight-all')?.addEventListener('click', () => {
        isHighlightActive = !isHighlightActive;
        const slotElements = document.querySelectorAll<HTMLElement>(
          '[data-slotwire-slot], .slotwire-ghost-slot, .slotwire-ghost-card'
        );

        slotElements.forEach((el) => {
          if (isHighlightActive) {
            el.setAttribute('data-sw-prev-outline', el.style.outline || '');
            el.style.outline = '3px dashed #10b981';
            el.style.outlineOffset = '4px';
          } else {
            el.style.outline = el.getAttribute('data-sw-prev-outline') || '';
            el.removeAttribute('data-sw-prev-outline');
          }
        });

        renderApp();
      });

      // Attach Direct Visual Selection Mode on "Request Slot" click with immediate dismissal
      windowElement.querySelector('#sw-tb-request-slot')?.addEventListener('click', () => {
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
        startVisualElementPicker();
      });
    }

    // Modal & Breadcrumb Selector Controller
    function openSlotRequestModal(info: {
      selectedElement: HTMLElement;
      hierarchy: Array<{ el: HTMLElement; selector: string; label: string; suggestedKey: string }>;
      selectedIndex: number;
    }) {
      document.getElementById('sw-request-slot-modal-root')?.remove();

      let activeIndex = info.selectedIndex;
      let currentItem = info.hierarchy[activeIndex] || info.hierarchy[0];

      const modalRoot = document.createElement('div');
      modalRoot.id = 'sw-request-slot-modal-root';

      function renderModalContent() {
        currentItem = info.hierarchy[activeIndex] || info.hierarchy[0];
        const sampleText = (currentItem.el.textContent || '').trim().slice(0, 90);

        modalRoot.innerHTML = `
          <div id="sw-modal-backdrop" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:999999; display:flex; align-items:center; justify-content:center; padding:16px; transition:opacity 0.2s ease;">
            <div style="background:#09090b; border:1px solid #27272a; border-radius:16px; width:520px; max-width:100%; box-shadow:0 25px 50px -12px rgba(0,0,0,0.85); font-family:system-ui,-apple-system,sans-serif; color:#f4f4f5; overflow:hidden; display:flex; flex-direction:column;">
              <!-- Header -->
              <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #27272a; background:#18181b;">
                <div style="display:flex; align-items:center; gap:8px; font-weight:700; font-size:14px; color:#34d399;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#10b981" stroke-width="1.8"/>
                    <rect x="16" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#06b6d4" stroke-width="1.8"/>
                    <path d="M6.5 8.5H17.5" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                  Request Slot in Model
                </div>
                <button id="sw-modal-close-btn" style="background:transparent; border:none; color:#a1a1aa; font-size:16px; cursor:pointer; padding:4px;">✕</button>
              </div>

              <!-- Body -->
              <div style="padding:20px; display:flex; flex-direction:column; gap:14px; font-size:12px;">
                <!-- DOM Breadcrumbs / Hierarchy Selection -->
                <div style="background:#18181b; border:1px solid #27272a; border-radius:8px; padding:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:600; color:#fafafa;">Selected Hierarchy Chain:</span>
                    <div style="display:flex; gap:6px;">
                      <button id="sw-modal-flash-btn" style="background:#065f46; border:1px solid #10b981; color:#34d399; border-radius:4px; padding:3px 8px; font-size:11px; font-weight:600; cursor:pointer;" title="Temporarily hide popup and flash this element on the page">
                        👁️ See This Element
                      </button>
                      <button id="sw-modal-repick-btn" style="background:#27272a; border:1px solid #3f3f46; color:#a1a1aa; border-radius:4px; padding:3px 8px; font-size:11px; font-weight:600; cursor:pointer;">
                        🎯 Re-Pick
                      </button>
                    </div>
                  </div>
                  <div style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${info.hierarchy
                      .map(
                        (item, idx) => `
                      <button class="sw-hierarchy-chip" data-idx="${idx}" style="background:${
                          idx === activeIndex ? '#065f46' : '#27272a'
                        }; border:1px solid ${
                          idx === activeIndex ? '#10b981' : '#3f3f46'
                        }; color:${
                          idx === activeIndex ? '#ffffff' : '#d4d4d8'
                        }; border-radius:6px; padding:4px 8px; font-size:11px; font-family:monospace; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                        ${idx === 0 ? '🎯 ' : '↳ '}${item.label}
                      </button>
                    `
                      )
                      .join('')}
                  </div>
                  <div style="font-family:monospace; color:#a1a1aa; font-size:10px; margin-top:8px;">
                    Selector: <strong style="color:#34d399;">${currentItem.selector}</strong>
                  </div>
                </div>

                <!-- Proposed Slot Key -->
                <div>
                  <label style="display:block; font-weight:600; color:#d4d4d8; margin-bottom:4px;">Proposed Slot Key <span style="color:#ef4444;">*</span>:</label>
                  <input id="sw-input-slot" type="text" value="${currentItem.suggestedKey}" style="width:100%; background:#18181b; border:1px solid #3f3f46; border-radius:6px; padding:8px 10px; color:#ffffff; font-family:monospace; font-weight:bold; box-sizing:border-box;" />
                </div>

                <!-- Collection & Archetype Selection -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <div>
                    <label style="display:block; font-weight:600; color:#d4d4d8; margin-bottom:4px;">Target CMS Collection:</label>
                    <input id="sw-input-collection" type="text" value="${currentItem.suggestedKey.includes('section') ? 'page_sections' : currentItem.suggestedKey.includes('card') ? 'feature_cards' : 'page_sections'}" style="width:100%; background:#18181b; border:1px solid #3f3f46; border-radius:6px; padding:8px 10px; color:#ffffff; font-family:monospace; box-sizing:border-box;" />
                  </div>
                  <div>
                    <label style="display:block; font-weight:600; color:#d4d4d8; margin-bottom:4px;">
                      Archetype <span style="font-weight:normal; color:#a1a1aa;">(Click to select) ▼</span>:
                    </label>
                    <div style="position:relative;">
                      <select id="sw-input-archetype" style="width:100%; background:#18181b; border:1px solid #10b981; border-radius:6px; padding:8px 30px 8px 10px; color:#ffffff; font-weight:600; font-size:12px; appearance:none; -webkit-appearance:none; cursor:pointer; box-sizing:border-box;">
                        ${SLOT_ARCHETYPES.map(
                          (arch) => `
                          <option value="${arch.id}" ${arch.id === 'section' ? 'selected' : ''}>
                            ${arch.name}
                          </option>
                        `
                        ).join('')}
                      </select>
                      <div style="position:absolute; right:10px; top:50%; transform:translateY(-50%); pointer-events:none; color:#10b981; font-size:10px;">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Notes / Requirements -->
                <div>
                  <label style="display:block; font-weight:600; color:#d4d4d8; margin-bottom:4px;">Requirements & Context for Engineering:</label>
                  <textarea id="sw-input-notes" rows="3" placeholder="Explain what fields this slot should manage..." style="width:100%; background:#18181b; border:1px solid #3f3f46; border-radius:6px; padding:8px 10px; color:#ffffff; font-size:12px; box-sizing:border-box;">${sampleText ? `Sample content snippet: "${sampleText}..."` : ''}</textarea>
                </div>

                <div style="display:flex; align-items:center; gap:8px; font-size:11px; color:#a1a1aa;">
                  <input type="checkbox" id="sw-input-dispatch" checked style="accent-color:#10b981;" />
                  <label for="sw-input-dispatch">Dispatch ticket to SlotWire CMS Queue (<code>slotwire_tickets</code>)</label>
                </div>
              </div>

              <!-- Footer -->
              <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px; padding:14px 20px; border-top:1px solid #27272a; background:#18181b;">
                <button id="sw-modal-cancel-btn" style="background:#27272a; border:1px solid #3f3f46; color:#d4d4d8; border-radius:6px; padding:8px 14px; font-size:12px; font-weight:600; cursor:pointer;">
                  Cancel
                </button>
                <button id="sw-modal-submit-btn" style="background:#059669; border:1px solid #10b981; color:#ffffff; border-radius:6px; padding:8px 16px; font-size:12px; font-weight:700; cursor:pointer;">
                  🚀 Create Ticket & Copy Snippet
                </button>
              </div>
            </div>
          </div>
        `;

        // Archetype change sync with collection input
        const archetypeSelect = modalRoot.querySelector('#sw-input-archetype') as HTMLSelectElement;
        const collectionInput = modalRoot.querySelector('#sw-input-collection') as HTMLInputElement;
        const archetypeToCollectionMap: Record<string, string> = {
          section: 'page_sections',
          cards: 'feature_cards',
          gallery: 'gallery',
          endorsements: 'endorsements',
          testimonials: 'endorsements',
          page: 'pages',
          qa: 'faq_items',
          table: 'page_sections',
          singleton: 'site_settings',
        };

        archetypeSelect?.addEventListener('change', () => {
          const selectedArch = archetypeSelect.value;
          if (archetypeToCollectionMap[selectedArch]) {
            collectionInput.value = archetypeToCollectionMap[selectedArch];
          }
        });

        // Helper: Flash element visually
        function flashElement(el: HTMLElement) {
          const backdrop = modalRoot.querySelector<HTMLElement>('#sw-modal-backdrop');
          if (backdrop) {
            backdrop.style.opacity = '0.06';
            backdrop.style.pointerEvents = 'none';
          }

          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const prevOutline = el.style.outline;
          const prevShadow = el.style.boxShadow;
          const prevOffset = el.style.outlineOffset;

          el.style.outline = '4px solid #06b6d4';
          el.style.outlineOffset = '4px';
          el.style.boxShadow = '0 0 25px rgba(6, 182, 212, 0.7)';

          setTimeout(() => {
            el.style.outline = prevOutline;
            el.style.boxShadow = prevShadow;
            el.style.outlineOffset = prevOffset;

            if (backdrop) {
              backdrop.style.opacity = '1';
              backdrop.style.pointerEvents = 'auto';
            }
          }, 1500);
        }

        // Helper: Pulse Flash Button as suggestion
        function pulseFlashButton() {
          const btn = modalRoot.querySelector<HTMLElement>('#sw-modal-flash-btn');
          if (btn) {
            btn.style.borderColor = '#34d399';
            btn.style.boxShadow = '0 0 14px rgba(52, 211, 153, 0.9)';
            btn.style.transform = 'scale(1.05)';
            btn.style.transition = 'all 0.2s ease';
            setTimeout(() => {
              btn.style.borderColor = '#10b981';
              btn.style.boxShadow = 'none';
              btn.style.transform = 'scale(1)';
            }, 800);
          }
        }

        // Wire hierarchy chips with click & button pulse
        modalRoot.querySelectorAll('.sw-hierarchy-chip').forEach((chip) => {
          chip.addEventListener('click', (e) => {
            activeIndex = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0', 10);
            renderModalContent();
            pulseFlashButton();
          });
        });

        // Flash Button
        modalRoot.querySelector('#sw-modal-flash-btn')?.addEventListener('click', () => {
          if (currentItem.el) {
            flashElement(currentItem.el);
          }
        });

        // Close handlers
        modalRoot.querySelector('#sw-modal-close-btn')?.addEventListener('click', () => {
          modalRoot.remove();
          restoreToolbarCanvas();
        });
        modalRoot.querySelector('#sw-modal-cancel-btn')?.addEventListener('click', () => {
          modalRoot.remove();
          restoreToolbarCanvas();
        });

        // Re-Pick Handler
        modalRoot.querySelector('#sw-modal-repick-btn')?.addEventListener('click', () => {
          modalRoot.remove();
          startVisualElementPicker();
        });

        // Submit Ticket Handler
        modalRoot.querySelector('#sw-modal-submit-btn')?.addEventListener('click', async () => {
          const slotInput = (modalRoot.querySelector('#sw-input-slot') as HTMLInputElement)?.value.trim();
          if (!slotInput) {
            alert('Please specify a Slot Key.');
            return;
          }

          const slotKey = slotInput.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          const collection = (modalRoot.querySelector('#sw-input-collection') as HTMLInputElement)?.value.trim() || 'page_sections';
          const archetype = (modalRoot.querySelector('#sw-input-archetype') as HTMLSelectElement)?.value || 'section';
          const notes = (modalRoot.querySelector('#sw-input-notes') as HTMLTextAreaElement)?.value.trim() || '';
          const shouldDispatch = (modalRoot.querySelector('#sw-input-dispatch') as HTMLInputElement)?.checked;

          const ticketPayload = {
            version: '1.0.0',
            ticketId: `SW-${Date.now().toString(36).toUpperCase()}`,
            timestamp: new Date().toISOString(),
            type: 'slot_request',
            route: window.location.pathname,
            proposedSlot: slotKey,
            collection,
            archetype,
            selector: currentItem.selector,
            notes,
            suggestedCodeSnippet: `<SlotWire slot="${slotKey}" collection="${collection}" archetype="${archetype}" required={false}>\n  <!-- ${currentItem.label} -->\n</SlotWire>`,
          };

          const markdown = `### ⚡ SlotWire Architecture Ticket: Request New Slot (${ticketPayload.ticketId})\n- **Route**: \`${ticketPayload.route}\`\n- **Proposed Slot Key**: \`${ticketPayload.proposedSlot}\`\n- **Target Collection**: \`${ticketPayload.collection}\`\n- **Archetype**: \`${ticketPayload.archetype}\`\n- **DOM Selector**: \`${ticketPayload.selector}\`\n- **Notes**: ${ticketPayload.notes}\n\n\`\`\`astro\n${ticketPayload.suggestedCodeSnippet}\n\`\`\``;

          let dispatchStatus = 'copied';
          if (shouldDispatch) {
            try {
              const res = await fetch('/api/slotwire/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketPayload),
              });
              if (res.ok) {
                dispatchStatus = 'dispatched';
              } else {
                const errJson = await res.json().catch(() => ({}));
                dispatchStatus = `warning: ${errJson.error || 'HTTP ' + res.status}`;
              }
            } catch (err: any) {
              dispatchStatus = `warning: ${err.message}`;
            }
          }

          if (navigator.clipboard) {
            navigator.clipboard.writeText(markdown);
          }

          modalRoot.remove();
          restoreToolbarCanvas();

          if (dispatchStatus === 'dispatched') {
            showToast(`✅ Ticket ${ticketPayload.ticketId} saved to queue & snippet copied to clipboard!`);
          } else if (dispatchStatus.startsWith('warning:')) {
            showToast(`📋 Snippet copied! (CMS Queue notice: ${dispatchStatus.replace('warning: ', '')})`);
          } else {
            showToast(`✅ Ticket ${ticketPayload.ticketId} created & Astro snippet copied to clipboard!`);
          }
        });
      }

      document.body.appendChild(modalRoot);
      renderModalContent();
    }

    function restoreToolbarCanvas() {
      const tbWindow = canvas.querySelector('astro-dev-toolbar-window');
      if (tbWindow) tbWindow.style.display = '';
      if (canvas.host) (canvas.host as HTMLElement).style.display = '';
    }

    // Interactive Visual Element Picker Mode
    function startVisualElementPicker() {
      const banner = document.createElement('div');
      banner.id = 'sw-picker-banner';
      banner.innerHTML = `
        <div style="position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#09090b; border:1px solid #10b981; border-radius:9999px; padding:10px 24px; color:#ffffff; font-family:system-ui,sans-serif; font-size:13px; font-weight:600; z-index:999999; box-shadow:0 10px 25px -5px rgba(0,0,0,0.8); display:flex; align-items:center; gap:12px; cursor:default;">
          <span style="color:#34d399;">🎯 Click any section or element to capture it for your Slot Ticket</span>
          <span style="color:#71717a; font-size:11px;">(Press ESC to cancel)</span>
        </div>
      `;
      document.body.appendChild(banner);

      const touchedElements = new Map<HTMLElement, string>();
      let hoveredEl: HTMLElement | null = null;

      function clearAllHighlights() {
        touchedElements.forEach((originalOutline, el) => {
          el.style.outline = originalOutline;
          el.style.cursor = '';
        });
        touchedElements.clear();
      }

      function onMouseMove(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target || target.closest('#sw-picker-banner') || target.closest('astro-dev-toolbar')) return;

        if (hoveredEl && hoveredEl !== target) {
          const orig = touchedElements.get(hoveredEl) || '';
          hoveredEl.style.outline = orig;
          hoveredEl.style.cursor = '';
        }

        hoveredEl = target;
        if (!touchedElements.has(target)) {
          touchedElements.set(target, target.style.outline || '');
        }

        target.style.outline = '3px dashed #06b6d4';
        target.style.outlineOffset = '2px';
        target.style.cursor = 'crosshair';
      }

      function onClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target || target.closest('#sw-picker-banner') || target.closest('astro-dev-toolbar')) return;

        e.preventDefault();
        e.stopPropagation();

        clearAllHighlights();
        cleanup();

        // Build DOM hierarchy chain (target -> parents)
        const hierarchy: Array<{ el: HTMLElement; selector: string; label: string; suggestedKey: string }> = [];
        let curr: HTMLElement | null = target;
        let depth = 0;

        while (curr && curr !== document.body && depth < 4) {
          const tag = curr.tagName.toLowerCase();
          let sel = tag;
          let label = tag;

          if (curr.id) {
            sel = `#${curr.id}`;
            label = `#${curr.id}`;
          } else if (curr.className && typeof curr.className === 'string') {
            const firstClass = curr.className.split(' ').filter(Boolean)[0];
            if (firstClass) {
              sel = `${tag}.${firstClass}`;
              label = `${tag}.${firstClass}`;
            }
          }

          const headingText = curr.querySelector('h1, h2, h3, h4')?.textContent?.trim() || '';
          const nameSource = curr.id || curr.getAttribute('data-slotwire-slot') || headingText || sel;
          const cleanKey = nameSource.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);

          hierarchy.push({
            el: curr,
            selector: sel,
            label: `${label}${headingText ? ` ("${headingText.slice(0, 18)}...")` : ''}`,
            suggestedKey: cleanKey ? `${cleanKey}_slot` : `${tag}_slot`,
          });

          curr = curr.parentElement;
          depth++;
        }

        openSlotRequestModal({
          selectedElement: target,
          hierarchy,
          selectedIndex: 0,
        });
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          clearAllHighlights();
          cleanup();
          restoreToolbarCanvas();
        }
      }

      function cleanup() {
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('click', onClick, true);
        document.removeEventListener('keydown', onKeyDown, true);
        banner.remove();
      }

      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('click', onClick, true);
      document.addEventListener('keydown', onKeyDown, true);
    }

    function showToast(message: string) {
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#09090b; border:1px solid #10b981; border-radius:12px; padding:12px 24px; color:#f4f4f5; font-family:system-ui,sans-serif; font-size:13px; font-weight:600; z-index:999999; box-shadow:0 20px 25px -5px rgba(0,0,0,0.8); display:flex; align-items:center; gap:8px;">
          ${message}
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }

    // Initial render
    areWireframesVisible = typeof window !== 'undefined' ? sessionStorage.getItem('slotwire_hide_overlays') !== 'true' : true;
    renderApp();

    // Re-render and sync on Astro View Transitions client navigation
    const syncAndRender = () => {
      areWireframesVisible = typeof window !== 'undefined' ? sessionStorage.getItem('slotwire_hide_overlays') !== 'true' : true;
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
