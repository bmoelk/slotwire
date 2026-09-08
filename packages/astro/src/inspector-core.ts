/**
 * Universal SlotWire Inspector Core
 * Shared UI and functionality between Astro Dev Toolbar and Floating Assist Pill
 */

export interface InspectorOptions {
  adminUrl?: string;
  envTag?: string;
  provider?: string;
  showCloseBtn?: boolean;
  showRequestSlotBtn?: boolean;
  onClose?: () => void;
  onRequestSlot?: () => void;
  onSlotCountChange?: (count: number) => void;
}

export const INSPECTOR_CSS = `
  .sw-inspector {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #09090b !important;
    color: #f4f4f5 !important;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;
    width: 440px;
    max-width: calc(100vw - 32px);
    border-radius: 12px;
    border: 1px solid #27272a !important;
    box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05);
    text-align: left;
    color-scheme: dark;
  }

  .sw-inspector * {
    box-sizing: border-box;
  }

  .sw-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #27272a;
    padding-bottom: 8px;
  }

  .sw-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 13px;
    color: #fafafa;
  }

  .sw-env-tag {
    font-size: 9px;
    padding: 2px 5px;
    border-radius: 4px;
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .sw-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sw-btn {
    background: #18181b;
    color: #e4e4e7;
    border: 1px solid #27272a;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s ease;
  }

  .sw-btn:hover {
    background: #27272a;
    border-color: #3f3f46;
    color: #ffffff;
  }

  .sw-btn-active {
    background: rgba(16, 185, 129, 0.15) !important;
    border-color: #10b981 !important;
    color: #34d399 !important;
  }

  .sw-btn-cms {
    background: #451a03 !important;
    border: 1px solid #d97706 !important;
    color: #fb923c !important;
    font-weight: 700 !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  }
  .sw-btn-cms:hover {
    background: #78350f !important;
    border-color: #f97316 !important;
    color: #fdba74 !important;
    box-shadow: 0 0 12px rgba(217, 119, 6, 0.45);
  }

  .sw-btn-cms.sw-provider-directus {
    background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
    border-color: #4338ca !important;
    color: #ffffff !important;
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25);
  }
  .sw-btn-cms.sw-provider-directus:hover {
    background: #818cf8 !important;
    box-shadow: 0 0 14px rgba(99, 102, 241, 0.45);
  }

  .sw-btn-cms.sw-provider-sonicjs {
    background: linear-gradient(135deg, #10b981, #059669) !important;
    border-color: #047857 !important;
    color: #09090b !important;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
  }
  .sw-btn-cms.sw-provider-sonicjs:hover {
    background: #34d399 !important;
    box-shadow: 0 0 14px rgba(16, 185, 129, 0.45);
  }

  .sw-progress-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sw-progress-bar {
    width: 100%;
    height: 6px;
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

  .sw-filter-bar {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sw-filter-input {
    width: 100%;
    padding: 6px 10px;
    background: #141417;
    border: 1px solid #27272a;
    border-radius: 6px;
    color: #f4f4f5;
    font-size: 11px;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .sw-filter-input:focus {
    border-color: #10b981;
  }

  .sw-filter-chips {
    display: flex;
    gap: 4px;
  }

  .sw-filter-chip {
    background: #18181b;
    border: 1px solid #27272a;
    color: #a1a1aa;
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .sw-filter-chip:hover {
    color: #ffffff;
    border-color: #3f3f46;
  }
  .sw-filter-chip.active {
    background: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
    color: #34d399;
    font-weight: 600;
  }

  /* Fixed Height Slot List Container (Never Resizes) */
  .sw-slot-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 250px !important;
    min-height: 250px !important;
    max-height: 250px !important;
    overflow-y: auto !important;
    padding-right: 4px;
  }

  .sw-slot-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #141417;
    border: 1px solid #27272a;
    border-radius: 7px;
    padding: 7px 10px;
    font-size: 11px;
    gap: 8px;
    transition: border-color 0.15s ease;
  }
  .sw-slot-item:hover {
    border-color: rgba(16, 185, 129, 0.5);
  }

  .sw-slot-info {
    overflow: hidden;
    flex: 1;
  }

  .sw-slot-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sw-slot-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 700;
    font-size: 12px;
    color: #f4f4f5;
  }

  .sw-archetype-tag {
    font-size: 9px;
    background: #27272a;
    color: #a1a1aa;
    padding: 1px 5px;
    border-radius: 3px;
  }

  .sw-slot-meta-row {
    font-size: 10px;
    color: #a1a1aa;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sw-badge-status {
    font-weight: 600;
  }
  .sw-badge-status.published { color: #10b981; }
  .sw-badge-status.draft { color: #fbbf24; }
  .sw-badge-status.new { color: #22d3ee; }
  .sw-badge-status.ghost { color: #f87171; }

  .sw-slot-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .sw-slot-edit-btn {
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 3px !important;
    padding: 3px 8px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
  }

  .sw-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    border-top: 1px solid #27272a;
    padding-top: 8px;
  }

  /* Global Hide-Overlays Styles (Toggled by Overlays Button) */
  .slotwire-hide-overlays .slotwire-in-situ-badge,
  .slotwire-hide-overlays .slotwire-composite-popover {
    display: none !important;
  }
  .slotwire-hide-overlays .slotwire-slot-container {
    outline: none !important;
  }
  .slotwire-hide-overlays .slotwire-ghost-card {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .slotwire-hide-overlays .sw-ghost-header,
  .slotwire-hide-overlays .sw-ghost-context-row,
  .slotwire-hide-overlays .sw-ghost-explainer-box {
    display: none !important;
  }
`;

export function renderInspectorHtml(options: InspectorOptions = {}) {
  const adminUrl = options.adminUrl || '/admin';
  const envTag = options.envTag || 'DEV';
  const showCloseBtn = Boolean(options.showCloseBtn);
  const provider = (options.provider || 'slottd').toLowerCase();
  const providerLabel =
    provider === 'slottd'
      ? 'SlottD'
      : provider === 'directus'
      ? 'Directus'
      : provider === 'sonicjs'
      ? 'SonicJS'
      : provider.charAt(0).toUpperCase() + provider.slice(1);

  return `
    <div class="sw-inspector">
      <!-- Header -->
      <div class="sw-header">
        <div class="sw-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#10b981" stroke-width="1.8"/>
            <rect x="16" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#06b6d4" stroke-width="1.8"/>
            <circle cx="5" cy="8.5" r="1.2" fill="#10b981"/>
            <circle cx="5" cy="15.5" r="1.2" fill="#10b981"/>
            <circle cx="19" cy="8.5" r="1.2" fill="#06b6d4"/>
            <circle cx="19" cy="15.5" r="1.2" fill="#06b6d4"/>
            <path d="M6.5 8.5H17.5" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M6.5 15.5H17.5" stroke="#06b6d4" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span>SlotWire Inspector</span>
          <span class="sw-env-tag">${envTag}</span>
        </div>
        <div class="sw-header-actions">
          <button id="sw-btn-toggle-overlays" class="sw-btn" title="Toggle hover overlays to inspect clean page">
            👁️ Overlays: ON
          </button>
          <button id="sw-btn-rescan" class="sw-btn" title="Rescan page DOM">↻</button>
          ${showCloseBtn ? '<button id="sw-btn-close" class="sw-btn" style="padding:4px 7px;" title="Close Inspector">✕</button>' : ''}
        </div>
      </div>

      <!-- Completeness Progress Bar -->
      <div class="sw-progress-wrap">
        <div style="display:flex; justify-content:space-between; font-family:ui-monospace,monospace; font-size:11px;">
          <span>Completeness:</span>
          <span id="sw-progress-pct" style="font-weight:bold; color:#10b981;">0%</span>
        </div>
        <div class="sw-progress-bar">
          <div id="sw-progress-fill" class="sw-progress-fill" style="width: 0%;"></div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="sw-filter-bar">
        <input
          type="text"
          id="sw-filter-search"
          placeholder="Filter slots by name, archetype, collection..."
          class="sw-filter-input"
        />
        <div class="sw-filter-chips">
          <button class="sw-filter-chip active" data-filter="all">All</button>
          <button class="sw-filter-chip" data-filter="published">Published</button>
          <button class="sw-filter-chip" data-filter="draft">Draft</button>
          <button class="sw-filter-chip" data-filter="new">New</button>
          <button class="sw-filter-chip" data-filter="missing">Missing</button>
        </div>
      </div>

      <!-- Fixed-Height Slot List -->
      <div id="sw-slot-list-container" class="sw-slot-list">
        <div style="text-align:center; padding:20px; color:#71717a; font-size:11px;">
          Auditing page slots...
        </div>
      </div>

      <!-- Footer -->
      <div class="sw-footer">
        <button id="sw-btn-highlight-all" class="sw-btn">
          📍 Highlight All
        </button>
        ${options.showRequestSlotBtn ? '<button id="sw-btn-request-slot" class="sw-btn" title="Visually select an element to request a slot">🎯 Request Slot</button>' : ''}
        <a href="${adminUrl}" target="_blank" rel="noopener noreferrer" class="sw-btn sw-btn-cms sw-provider-${provider}">
          Open ${providerLabel} Studio ↗
        </a>
      </div>
    </div>
  `;
}

export function initInspector(containerEl: HTMLElement, options: InspectorOptions = {}) {
  const adminUrl = options.adminUrl || '/admin';

  let areOverlaysVisible = sessionStorage.getItem('slotwire_hide_overlays') !== 'true';
  let isHighlightActive = false;
  let activeFilter = 'all';
  let searchQuery = '';

  // 1. Overlay Visibility Controller
  function syncOverlayState(visible: boolean) {
    areOverlaysVisible = visible;
    sessionStorage.setItem('slotwire_hide_overlays', visible ? 'false' : 'true');

    if (!visible) {
      document.documentElement.classList.add('slotwire-hide-overlays');
    } else {
      document.documentElement.classList.remove('slotwire-hide-overlays');
    }

    const toggleBtn = containerEl.querySelector('#sw-btn-toggle-overlays');
    if (toggleBtn) {
      toggleBtn.textContent = visible ? '👁️ Overlays: ON' : '🙈 Overlays: OFF';
      if (!visible) {
        toggleBtn.classList.add('sw-btn-active');
      } else {
        toggleBtn.classList.remove('sw-btn-active');
      }
    }
  }

  // 2. Highlight All Controller
  function toggleHighlightAll() {
    isHighlightActive = !isHighlightActive;
    const slotElements = document.querySelectorAll<HTMLElement>(
      '[data-slotwire-slot], .slotwire-slot-container, .slotwire-ghost-slot, .slotwire-ghost-card'
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

    const highlightBtn = containerEl.querySelector('#sw-btn-highlight-all');
    if (highlightBtn) {
      highlightBtn.textContent = isHighlightActive ? '✕ Clear Highlights' : '📍 Highlight All';
      if (isHighlightActive) {
        highlightBtn.classList.add('sw-btn-active');
      } else {
        highlightBtn.classList.remove('sw-btn-active');
      }
    }
  }

  // 3. Scan DOM & Render Slot Items
  function scanAndRender() {
    const slotElements = Array.from(
      document.querySelectorAll<HTMLElement>('.slotwire-slot-container, [data-slotwire-slot]')
    );

    // Deduplicate nested elements
    const seenSlots = new Set<HTMLElement>();
    const uniqueElements: HTMLElement[] = [];
    slotElements.forEach((el) => {
      const container = el.closest('.slotwire-slot-container') as HTMLElement || el;
      if (!seenSlots.has(container)) {
        seenSlots.add(container);
        uniqueElements.push(container);
      }
    });

    const totalSlots = uniqueElements.length;
    if (options.onSlotCountChange) {
      options.onSlotCountChange(totalSlots);
    }

    let populatedSlots = 0;
    let draftSlots = 0;
    let newSlots = 0;
    let missingSlots = 0;

    const items = uniqueElements.map((el, idx) => {
      const slot = el.getAttribute('data-slotwire-slot') || el.dataset.slotwireSlot || 'slot';
      const archetype = el.getAttribute('data-slotwire-archetype') || el.dataset.slotwireArchetype || 'slot';
      const collection = el.getAttribute('data-slotwire-collection') || el.dataset.slotwireCollection || slot;
      const statusAttr = el.getAttribute('data-slotwire-status') || el.dataset.slotwireStatus || 'Published';
      const editUrl = el.getAttribute('data-slotwire-edit-url') || el.dataset.slotwireEditUrl || `${adminUrl}/content/${collection}`;
      const isMissing = el.classList.contains('slotwire-ghost-slot') || el.classList.contains('slotwire-ghost-card') || el.getAttribute('data-slotwire-source') === 'fallback';

      let statusType = 'published';
      let statusLabel = '[✓ Published]';

      if (isMissing) {
        missingSlots++;
        statusType = 'missing';
        statusLabel = '[✖ Missing]';
      } else if (statusAttr.includes('New')) {
        newSlots++;
        populatedSlots++;
        statusType = 'new';
        statusLabel = '[✨ New]';
      } else if (statusAttr.includes('Draft') || statusAttr.includes('modified')) {
        draftSlots++;
        populatedSlots++;
        statusType = 'draft';
        statusLabel = '[⚠️ Draft]';
      } else {
        populatedSlots++;
      }

      return {
        idx,
        element: el,
        slot,
        archetype,
        collection,
        statusType,
        statusLabel,
        editUrl,
      };
    });

    // Update completeness progress bar
    const pct = totalSlots > 0 ? Math.round((populatedSlots / totalSlots) * 100) : 100;
    const pctEl = containerEl.querySelector('#sw-progress-pct');
    const fillEl = containerEl.querySelector<HTMLElement>('#sw-progress-fill');
    if (pctEl) pctEl.textContent = `${pct}% (${populatedSlots}/${totalSlots})`;
    if (fillEl) fillEl.style.width = `${pct}%`;

    // Render list items
    const listEl = containerEl.querySelector('#sw-slot-list-container');
    if (!listEl) return;

    const filteredItems = items.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.slot.toLowerCase().includes(searchQuery) ||
        item.archetype.toLowerCase().includes(searchQuery) ||
        item.collection.toLowerCase().includes(searchQuery);

      const matchesFilter =
        activeFilter === 'all' ||
        item.statusType === activeFilter;

      return matchesSearch && matchesFilter;
    });

    if (items.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:24px; color:#71717a; font-size:11px;">
          No &lt;SlotWire /&gt; slots detected on this route.<br>
          Wrap components with &lt;SlotWire slot="..." /&gt;.
        </div>
      `;
      return;
    }

    if (filteredItems.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:24px; color:#71717a; font-size:11px;">
          No slots match filter "${activeFilter}" ${searchQuery ? `and query "${searchQuery}"` : ''}.
        </div>
      `;
      return;
    }

    listEl.innerHTML = filteredItems
      .map(
        (item) => `
        <div class="sw-slot-item">
          <div class="sw-slot-info">
            <div class="sw-slot-name-row">
              <span class="sw-slot-name">#${item.slot}</span>
              <span class="sw-archetype-tag">🏷️ ${item.archetype}</span>
            </div>
            <div class="sw-slot-meta-row">
              <span class="sw-badge-status ${item.statusType}">${item.statusLabel}</span>
              <span>• 📦 ${item.collection}</span>
            </div>
          </div>
          <div class="sw-slot-actions">
            <button class="sw-btn sw-locate-btn" data-locate-idx="${item.idx}">📍 Locate</button>
            <a href="${item.editUrl}" target="_blank" rel="noopener noreferrer" class="sw-btn sw-btn-cms sw-slot-edit-btn">
              ✏️ Edit ↗
            </a>
          </div>
        </div>
      `
      )
      .join('');

    // Attach Locate handlers
    listEl.querySelectorAll('.sw-locate-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetIdx = parseInt((e.target as HTMLElement).getAttribute('data-locate-idx') || '0', 10);
        const item = items[targetIdx];
        if (item && item.element) {
          item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          item.element.classList.remove('sw-flash-locate');
          void item.element.offsetWidth; // Trigger DOM reflow
          item.element.classList.add('sw-flash-locate');

          // Fallback outline pulse
          const prevOutline = item.element.style.outline;
          const prevOffset = item.element.style.outlineOffset;
          item.element.style.outline = '4px solid #10b981';
          item.element.style.outlineOffset = '4px';
          setTimeout(() => {
            item.element.style.outline = prevOutline;
            item.element.style.outlineOffset = prevOffset;
          }, 2500);
        }
      });
    });
  }

  // 4. Attach Event Handlers
  containerEl.querySelector('#sw-btn-toggle-overlays')?.addEventListener('click', () => {
    syncOverlayState(!areOverlaysVisible);
  });

  containerEl.querySelector('#sw-btn-highlight-all')?.addEventListener('click', toggleHighlightAll);

  containerEl.querySelector('#sw-btn-rescan')?.addEventListener('click', scanAndRender);

  if (options.onRequestSlot) {
    containerEl.querySelector('#sw-btn-request-slot')?.addEventListener('click', options.onRequestSlot);
  }

  if (options.onClose) {
    containerEl.querySelector('#sw-btn-close')?.addEventListener('click', options.onClose);
  }

  // Search input handler
  const searchEl = containerEl.querySelector<HTMLInputElement>('#sw-filter-search');
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      searchQuery = (e.target as HTMLInputElement).value.trim().toLowerCase();
      scanAndRender();
    });
  }

  // Filter chips handler
  containerEl.querySelectorAll('.sw-filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      containerEl.querySelectorAll('.sw-filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter') || 'all';
      scanAndRender();
    });
  });

  // Apply initial overlay state from storage
  syncOverlayState(areOverlaysVisible);

  // Run initial scan
  scanAndRender();
}

export const SLOT_ARCHETYPES = [
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

export function showToast(message: string) {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#09090b; border:1px solid #10b981; border-radius:12px; padding:12px 24px; color:#f4f4f5; font-family:system-ui,sans-serif; font-size:13px; font-weight:600; z-index:999999; box-shadow:0 20px 25px -5px rgba(0,0,0,0.8); display:flex; align-items:center; gap:8px;">
      ${message}
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

export function openSlotRequestModal(info: {
  selectedElement: HTMLElement;
  hierarchy: Array<{ el: HTMLElement; selector: string; label: string; suggestedKey: string }>;
  selectedIndex: number;
  onDone?: () => void;
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

    modalRoot.querySelectorAll('.sw-hierarchy-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        activeIndex = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0', 10);
        renderModalContent();
      });
    });

    modalRoot.querySelector('#sw-modal-flash-btn')?.addEventListener('click', () => {
      if (currentItem.el) {
        flashElement(currentItem.el);
      }
    });

    modalRoot.querySelector('#sw-modal-close-btn')?.addEventListener('click', () => {
      modalRoot.remove();
      info.onDone?.();
    });
    modalRoot.querySelector('#sw-modal-cancel-btn')?.addEventListener('click', () => {
      modalRoot.remove();
      info.onDone?.();
    });

    modalRoot.querySelector('#sw-modal-repick-btn')?.addEventListener('click', () => {
      modalRoot.remove();
      startVisualElementPicker(info.onDone);
    });

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
      info.onDone?.();

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

export function startVisualElementPicker(onDone?: () => void) {
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
    if (!target || target.closest('#sw-picker-banner') || target.closest('astro-dev-toolbar') || target.closest('#slotwire-assist-container')) return;

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
    if (!target || target.closest('#sw-picker-banner') || target.closest('astro-dev-toolbar') || target.closest('#slotwire-assist-container')) return;

    e.preventDefault();
    e.stopPropagation();

    clearAllHighlights();
    cleanup();

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
      onDone,
    });
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      clearAllHighlights();
      cleanup();
      onDone?.();
    }
  }

  function cleanup() {
    banner.remove();
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
  }

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
}
