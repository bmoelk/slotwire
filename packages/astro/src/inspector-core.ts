/**
 * Universal SlotWire Inspector Core
 * Shared UI and functionality between Astro Dev Toolbar and Floating Assist Pill
 */

export interface InspectorOptions {
  adminUrl?: string;
  siteId?: string;
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
    width: 480px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
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
    padding-bottom: 4px;
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

  .sw-slot-refresh-btn {
    padding: 4px 6px !important;
  }
  .sw-slot-refresh-btn:hover {
    color: #38bdf8 !important;
    border-color: rgba(56, 189, 248, 0.4) !important;
    background: rgba(56, 189, 248, 0.1) !important;
  }
  .sw-slot-refresh-btn.sw-spinning svg,
  #sw-btn-refresh-all.sw-spinning svg {
    animation: sw-badge-spin 0.75s linear infinite !important;
  }
  @keyframes sw-badge-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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

  /* Thin Integrated Completeness Divider (Dividing Horizontal Rule) */
  .sw-progress-divider {
    position: relative;
    width: 100%;
    height: 2px;
    background: #27272a;
    border-radius: 9999px;
    overflow: visible;
    cursor: pointer;
    margin: -4px 0 2px 0;
    transition: height 0.15s ease, background 0.15s ease;
  }

  .sw-progress-divider:hover {
    height: 4px;
    background: #3f3f46;
  }

  .sw-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #059669, #10b981);
    border-radius: 9999px;
    transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .sw-progress-tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background: #18181b;
    border: 1px solid #3f3f46;
    color: #f4f4f5;
    font-size: 10px;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition: all 0.15s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    z-index: 100;
  }

  .sw-progress-divider:hover .sw-progress-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }

  .sw-progress-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: #3f3f46 transparent transparent transparent;
  }

  /* Segmented Tab Navigation Bar */
  .sw-tab-bar {
    display: flex;
    background: #111114;
    border: 1px solid #27272a;
    border-radius: 6px;
    padding: 2px;
    gap: 2px;
  }

  .sw-tab-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 5px;
    color: #a1a1aa;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
    line-height: 1.2;
  }

  .sw-tab-btn:hover {
    color: #f4f4f5;
  }

  .sw-tab-btn.active {
    background: #1c1c20;
    color: #10b981;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  .sw-tab-badge {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
    font-size: 9px;
    padding: 0 4px;
    border-radius: 9999px;
    font-weight: 700;
    line-height: 13px;
  }

  /* Consistent Tab Pane Height Across All Tabs (Fits at least 6 slots & full telemetry) */
  .sw-tab-pane {
    display: none;
    flex-direction: column;
    gap: 8px;
    height: 455px;
    min-height: 455px;
    max-height: 455px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .sw-tab-pane.active {
    display: flex;
  }

  /* Telemetry & Diagnostics Pane (Scrollable within Fixed Height) */
  .sw-diag-pane {
    padding: 2px 2px 2px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #27272a transparent;
  }

  .sw-diag-header {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
    font-weight: 700;
    flex-shrink: 0;
  }

  .sw-diag-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    flex-shrink: 0;
  }

  .sw-diag-card {
    background: #141417;
    border: 1px solid #27272a;
    border-radius: 8px;
    padding: 9px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .sw-diag-card-title {
    font-size: 10px;
    color: #a1a1aa;
    display: flex;
    align-items: center;
    gap: 5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .sw-diag-card-val {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 16px;
    font-weight: 700;
    color: #34d399;
  }

  .sw-diag-details {
    background: #141417;
    border: 1px solid #27272a;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    font-size: 11px;
    flex-shrink: 0;
  }

  .sw-diag-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #a1a1aa;
    line-height: 1.35;
  }

  .sw-diag-row span:last-child {
    font-family: ui-monospace, monospace;
    color: #f4f4f5;
    font-weight: 600;
  }

  .sw-diag-actions {
    display: flex;
    gap: 8px;
    border-top: 1px solid #27272a;
    padding-top: 8px;
    flex-shrink: 0;
    margin-top: auto;
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

  /* Scrollable Slot List Container (Flexes within Fixed Height Tab Pane) */
  .sw-slot-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-height: 0;
    overflow-y: auto !important;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: #27272a transparent;
  }

  .sw-slot-list::-webkit-scrollbar,
  .sw-diag-pane::-webkit-scrollbar {
    width: 4px;
  }
  .sw-slot-list::-webkit-scrollbar-track,
  .sw-diag-pane::-webkit-scrollbar-track {
    background: transparent;
  }
  .sw-slot-list::-webkit-scrollbar-thumb,
  .sw-diag-pane::-webkit-scrollbar-thumb {
    background: #27272a;
    border-radius: 4px;
  }
  .sw-slot-list::-webkit-scrollbar-thumb:hover,
  .sw-diag-pane::-webkit-scrollbar-thumb:hover {
    background: #3f3f46;
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
  const siteId = options.siteId || '';
  const siteQuery = siteId ? `?site_id=${encodeURIComponent(siteId)}&site=${encodeURIComponent(siteId)}` : '';
  const envTag = options.envTag || 'DEV';
  const showCloseBtn = Boolean(options.showCloseBtn);
  const rawProvider =
    options.provider ||
    (typeof process !== 'undefined' && (process.env?.CMS_PROVIDER || process.env?.PUBLIC_CMS_PROVIDER)) ||
    (globalThis as any)?.__SLOTWIRE_CONFIG__?.cms?.provider ||
    'cms';
  const provider = String(rawProvider).toLowerCase();

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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Overlays: ON
          </button>
          <button id="sw-btn-toggle-highlights" class="sw-btn" title="Toggle slot outlines and contracts (Shortcut: Alt+S)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="3"/></svg>Highlight Slots: OFF
          </button>
          <button id="sw-btn-rescan" class="sw-btn" title="Rescan page DOM">↻</button>
          ${showCloseBtn ? '<button id="sw-btn-close" class="sw-btn" style="padding:4px 7px;" title="Close Inspector">✕</button>' : ''}
        </div>
      </div>

      <!-- Thin Integrated Completeness Divider (Dividing Horizontal Rule) -->
      <div id="sw-progress-divider" class="sw-progress-divider" title="Completeness: 0%">
        <div id="sw-progress-fill" class="sw-progress-fill" style="width: 0%;"></div>
        <span id="sw-progress-pct" class="sw-progress-tooltip">Completeness: 0%</span>
      </div>

      <!-- Segmented Tab Navigation Bar -->
      <div class="sw-tab-bar" id="sw-tab-bar">
        <button class="sw-tab-btn active" data-sw-tab="slots">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          <span>Slots</span>
          <span id="sw-tab-slots-count" class="sw-tab-badge">0</span>
        </button>
        <button class="sw-tab-btn" data-sw-tab="telemetry">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>Telemetry</span>
        </button>
      </div>

      <!-- Tab Pane 1: Editorial Slots View (Default) -->
      <div id="sw-tab-pane-slots" class="sw-tab-pane active">
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
          <button id="slotwire-precreate-trigger-btn" class="sw-btn" title="Create a new page from archetype blueprints" style="color:#10b981; border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.08);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>+ New Page
          </button>
          <button id="sw-btn-refresh-all" class="sw-btn" title="Refresh all slots from CMS without reloading page" style="display:inline-flex; align-items:center; gap:4px;">
            <svg class="sw-refresh-icon" width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.705 8.001a6.3 6.3 0 0 1 10.77-4.472l.447-.447a.75.75 0 0 1 1.28.53v3.136a.75.75 0 0 1-.75.75H10.32a.75.75 0 0 1-.53-1.28l.496-.496a4.8 4.8 0 0 0-8.21 2.269.75.75 0 0 1-.371.01Zm12.59 0a6.3 6.3 0 0 1-10.77 4.472l-.447.447a.75.75 0 0 1-1.28-.53V8.854a.75.75 0 0 1 .75-.75h3.132a.75.75 0 0 1 .53 1.28l-.496.496a4.8 4.8 0 0 0 8.21-2.269.75.75 0 0 1 .371-.01Z"/>
            </svg>
            Refresh
          </button>
          ${options.showRequestSlotBtn ? '<button id="sw-btn-request-slot" class="sw-btn" title="Visually select an element to request a slot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>Request Slot</button>' : ''}
          <a href="${adminUrl}${siteQuery}" target="_blank" rel="noopener noreferrer" class="sw-btn sw-btn-cms sw-provider-${provider}">
            Open CMS ↗
          </a>
        </div>
      </div>

      <!-- Tab Pane 2: Dedicated Telemetry & Performance View -->
      <div id="sw-tab-pane-telemetry" class="sw-tab-pane">
        <div class="sw-diag-pane">
          <div class="sw-diag-header">Page Telemetry & System Health</div>

          <!-- 4 Telemetry Metric Cards Grid -->
          <div class="sw-diag-grid">
            <div class="sw-diag-card">
              <div class="sw-diag-card-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Load Time
              </div>
              <div class="sw-diag-card-val" id="sw-tel-load">--</div>
            </div>
            <div class="sw-diag-card">
              <div class="sw-diag-card-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                DOM Ready
              </div>
              <div class="sw-diag-card-val" id="sw-tel-dom">--</div>
            </div>
            <div class="sw-diag-card">
              <div class="sw-diag-card-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Requests
              </div>
              <div class="sw-diag-card-val" id="sw-tel-requests">--</div>
            </div>
            <div class="sw-diag-card">
              <div class="sw-diag-card-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Slots Audited
              </div>
              <div class="sw-diag-card-val" id="sw-tel-slots">--</div>
            </div>
          </div>

          <!-- Environment & Timing Breakdown -->
          <div class="sw-diag-details">
            <div class="sw-diag-row">
              <span>Route</span>
              <span id="sw-diag-route">/</span>
            </div>
            <div class="sw-diag-row">
              <span>Server SSR Time</span>
              <span id="sw-diag-ssr-ms">--</span>
            </div>
            <div class="sw-diag-row">
              <span>Environment</span>
              <span id="sw-diag-env">${envTag}</span>
            </div>
            <div class="sw-diag-row">
              <span>Navigation Type</span>
              <span id="sw-diag-nav-type">navigate</span>
            </div>
            <div class="sw-diag-row">
              <span>Slot Status Breakdown</span>
              <span id="sw-diag-breakdown">--</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="sw-diag-actions">
          <button id="sw-btn-copy-report" class="sw-btn" style="flex:1; justify-content:center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Copy Diagnostic Report</span>
          </button>
          <button id="sw-btn-refresh-telemetry" class="sw-btn" title="Refresh metrics">
            ↻
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initInspector(containerEl: HTMLElement, options: InspectorOptions = {}) {
  const adminUrl = options.adminUrl || '/admin';
  const siteId = options.siteId || '';
  const siteQuery = siteId ? `?site_id=${encodeURIComponent(siteId)}&site=${encodeURIComponent(siteId)}` : '';

  let areOverlaysVisible = sessionStorage.getItem('slotwire_hide_overlays') !== 'true';
  let isHighlightActive =
    (typeof document !== 'undefined' && document.documentElement.classList.contains('slotwire-highlight-slots')) ||
    sessionStorage.getItem('slotwire_highlight_slots') === 'true';
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
      toggleBtn.innerHTML = visible
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Overlays: ON'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>Overlays: OFF';
      if (!visible) {
        toggleBtn.classList.add('sw-btn-active');
      } else {
        toggleBtn.classList.remove('sw-btn-active');
      }
    }
  }

  // 2. Highlight Slots Controller (Co-located with Overlays, Consistent ON/OFF State)
  function syncHighlightState(active: boolean) {
    isHighlightActive = active;
    sessionStorage.setItem('slotwire_highlight_slots', active ? 'true' : 'false');

    if (active) {
      document.documentElement.classList.add('slotwire-highlight-slots');
    } else {
      document.documentElement.classList.remove('slotwire-highlight-slots');
    }

    // Dynamic Overlay Badges for Static Elements (where SlotWire in-situ badge is not rendered)
    const staticSlots = document.querySelectorAll<HTMLElement>('[data-slotwire-slot]:not(.slotwire-slot-container)');
    staticSlots.forEach((el) => {
      let badge = el.querySelector<HTMLElement>(':scope > .slotwire-static-badge');
      if (active) {
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'slotwire-static-badge';
          const slot = el.getAttribute('data-slotwire-slot') || 'slot';
          const arch = el.getAttribute('data-slotwire-archetype') || '';
          badge.innerHTML = `<span>✓ <strong>${slot}</strong></span>${arch ? `<span class="sw-badge-arch">${arch}</span>` : ''}`;
          if (getComputedStyle(el).position === 'static') {
            el.style.position = 'relative';
          }
          el.prepend(badge);
        }
        badge.style.display = 'inline-flex';
      } else if (badge) {
        badge.style.display = 'none';
      }
    });

    const highlightBtn = containerEl.querySelector('#sw-btn-toggle-highlights');
    if (highlightBtn) {
      highlightBtn.innerHTML = active
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>Highlight Slots: ON'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="3"/></svg>Highlight Slots: OFF';
      if (active) {
        highlightBtn.classList.add('sw-btn-active');
      } else {
        highlightBtn.classList.remove('sw-btn-active');
      }
    }

    window.dispatchEvent(new CustomEvent('slotwire:highlight-change', { detail: { active } }));
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
      const editUrl = el.getAttribute('data-slotwire-edit-url') || el.dataset.slotwireEditUrl || `${adminUrl}/content/${collection}${siteQuery}`;
      const isMissing = el.classList.contains('slotwire-ghost-slot') || el.classList.contains('slotwire-ghost-card') || el.getAttribute('data-slotwire-source') === 'fallback';

      let statusType = 'published';
      let statusLabel = 'Published';

      if (isMissing) {
        missingSlots++;
        statusType = 'missing';
        statusLabel = 'Missing';
      } else if (statusAttr.includes('New')) {
        newSlots++;
        populatedSlots++;
        statusType = 'new';
        statusLabel = 'New';
      } else if (statusAttr.includes('Draft') || statusAttr.includes('modified')) {
        draftSlots++;
        populatedSlots++;
        statusType = 'draft';
        statusLabel = 'Draft';
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

    // Update tab badge count
    const tabSlotsCount = containerEl.querySelector('#sw-tab-slots-count');
    if (tabSlotsCount) tabSlotsCount.textContent = String(totalSlots);

    // Update completeness progress bar & hover tooltip
    const pct = totalSlots > 0 ? Math.round((populatedSlots / totalSlots) * 100) : 100;
    const pctEl = containerEl.querySelector('#sw-progress-pct');
    const fillEl = containerEl.querySelector<HTMLElement>('#sw-progress-fill');
    const dividerEl = containerEl.querySelector<HTMLElement>('#sw-progress-divider');
    const completenessText = `Completeness: ${pct}% (${populatedSlots}/${totalSlots} populated)`;
    if (pctEl) pctEl.textContent = completenessText;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (dividerEl) dividerEl.setAttribute('title', completenessText);

    // Collect & update live page loading telemetry
    function updateTelemetry() {
      if (typeof window === 'undefined') return;

      let loadMs = 0;
      let domMs = 0;
      let reqCount = 0;

      if (window.performance) {
        const navEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries && navEntries.length > 0) {
          const nav = navEntries[0];
          loadMs = Math.round(nav.duration || (nav.loadEventEnd ? nav.loadEventEnd - nav.startTime : 0));
          domMs = Math.round(nav.domInteractive ? nav.domInteractive - nav.startTime : 0);
        } else if (window.performance.timing) {
          const t = window.performance.timing;
          loadMs = t.loadEventEnd ? t.loadEventEnd - t.navigationStart : Math.max(0, Date.now() - t.navigationStart);
          domMs = t.domInteractive ? t.domInteractive - t.navigationStart : 0;
        }
        reqCount = window.performance.getEntriesByType('resource').length;
      }

      const telLoad = containerEl.querySelector<HTMLElement>('#sw-tel-load');
      const telDom = containerEl.querySelector<HTMLElement>('#sw-tel-dom');
      const telReqs = containerEl.querySelector<HTMLElement>('#sw-tel-requests');
      const telSlots = containerEl.querySelector<HTMLElement>('#sw-tel-slots');

      if (telLoad) {
        if (loadMs > 0) {
          telLoad.textContent = loadMs >= 1000 ? `${(loadMs / 1000).toFixed(2)}s` : `${loadMs}ms`;
          telLoad.style.color = loadMs < 800 ? '#34d399' : loadMs < 2000 ? '#fbbf24' : '#f87171';
        } else {
          telLoad.textContent = 'measuring';
          telLoad.style.color = '#71717a';
        }
      }
      if (telDom) telDom.textContent = domMs > 0 ? (domMs >= 1000 ? `${(domMs / 1000).toFixed(2)}s` : `${domMs}ms`) : 'ready';
      if (telReqs) telReqs.textContent = `${reqCount}`;
      if (telSlots) telSlots.textContent = `${totalSlots}`;

      // Detailed diagnostics breakdown
      const diagRoute = containerEl.querySelector('#sw-diag-route');
      if (diagRoute && typeof window !== 'undefined') diagRoute.textContent = window.location.pathname || '/';

      const diagSsr = containerEl.querySelector('#sw-diag-ssr-ms');
      if (diagSsr) {
        diagSsr.textContent = containerEl.dataset.ssrRenderMs ? `${containerEl.dataset.ssrRenderMs}ms` : 'Client';
      }

      const diagBreakdown = containerEl.querySelector('#sw-diag-breakdown');
      if (diagBreakdown) {
        diagBreakdown.textContent = `${populatedSlots} populated, ${draftSlots} draft, ${missingSlots} missing`;
      }

      if (typeof window !== 'undefined' && window.performance) {
        const navEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        const navType = (navEntries && navEntries[0]?.type) || 'navigate';
        const diagNav = containerEl.querySelector('#sw-diag-nav-type');
        if (diagNav) diagNav.textContent = navType;
      }

      if (loadMs > 0 || reqCount > 0) {
        console.log(`[SlotWire Telemetry] Page load: ${loadMs}ms (DOM: ${domMs}ms) | ${reqCount} network requests | ${totalSlots} slots audited (${populatedSlots} populated, ${missingSlots} missing)`);
      }
    }

    updateTelemetry();
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => setTimeout(updateTelemetry, 100), { once: true });
    }

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
              <span class="sw-archetype-tag">${item.archetype}</span>
            </div>
            <div class="sw-slot-meta-row">
              <span class="sw-badge-status ${item.statusType}">${item.statusLabel}</span>
              <span>• ${item.collection}</span>
            </div>
          </div>
          <div class="sw-slot-actions">
            <button class="sw-btn sw-quick-edit-trigger" data-slot-idx="${item.idx}" ${item.statusType === 'missing' ? 'disabled' : ''} style="${item.statusType === 'missing' ? 'opacity:0.4; cursor:not-allowed;' : 'color:#10b981; border-color:rgba(16,185,129,0.4); background:rgba(16,185,129,0.1);'} display:inline-flex; align-items:center; gap:4px;" title="${item.statusType === 'missing' ? `Cannot quick-edit: No document in CMS yet. Use 'CMS ↗' to create it.` : 'Quick edit in-situ'}"><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.249.249 0 0 0 .108-.064l6.286-6.286Z"/></svg> Quick Edit</button>
            <button class="sw-btn sw-locate-btn" data-locate-idx="${item.idx}">Locate</button>
            <button class="sw-btn sw-slot-refresh-btn" data-slot-name="${item.slot}" title="Refresh #${item.slot} from CMS without reloading page">
              <svg class="sw-refresh-icon" width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.705 8.001a6.3 6.3 0 0 1 10.77-4.472l.447-.447a.75.75 0 0 1 1.28.53v3.136a.75.75 0 0 1-.75.75H10.32a.75.75 0 0 1-.53-1.28l.496-.496a4.8 4.8 0 0 0-8.21 2.269.75.75 0 0 1-.371.01Zm12.59 0a6.3 6.3 0 0 1-10.77 4.472l-.447.447a.75.75 0 0 1-1.28-.53V8.854a.75.75 0 0 1 .75-.75h3.132a.75.75 0 0 1 .53 1.28l-.496.496a4.8 4.8 0 0 0 8.21-2.269.75.75 0 0 1 .371-.01Z"/>
              </svg>
            </button>
            <a href="${item.editUrl}" target="_blank" rel="noopener noreferrer" class="sw-btn sw-btn-cms sw-slot-edit-btn">
              CMS ↗
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

  // 4. Tab Switching Controller
  const tabBtns = containerEl.querySelectorAll<HTMLButtonElement>('.sw-tab-btn');
  const tabPanes = containerEl.querySelectorAll<HTMLElement>('.sw-tab-pane');

  function setActiveTab(tabName: string) {
    tabBtns.forEach((btn) => {
      if (btn.getAttribute('data-sw-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabPanes.forEach((pane) => {
      if (pane.id === `sw-tab-pane-${tabName}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    try {
      sessionStorage.setItem('slotwire_inspector_tab', tabName);
    } catch {}
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-sw-tab');
      if (tab) setActiveTab(tab);
    });
  });

  const savedTab = sessionStorage.getItem('slotwire_inspector_tab');
  if (savedTab === 'telemetry') {
    setActiveTab('telemetry');
  } else {
    setActiveTab('slots');
  }

  // 5. Attach Event Handlers
  containerEl.querySelector('#sw-btn-toggle-overlays')?.addEventListener('click', () => {
    syncOverlayState(!areOverlaysVisible);
  });

  containerEl.querySelector('#sw-btn-toggle-highlights')?.addEventListener('click', () => {
    syncHighlightState(!isHighlightActive);
  });

  window.addEventListener('slotwire:highlight-change', ((e: CustomEvent) => {
    if (e.detail?.active !== undefined && e.detail.active !== isHighlightActive) {
      syncHighlightState(e.detail.active);
    }
  }) as EventListener);

  containerEl.querySelector('#sw-btn-rescan')?.addEventListener('click', scanAndRender);

  // Copy Diagnostic Report handler
  const copyBtn = containerEl.querySelector<HTMLButtonElement>('#sw-btn-copy-report');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const telLoad = containerEl.querySelector('#sw-tel-load')?.textContent || 'N/A';
      const telDom = containerEl.querySelector('#sw-tel-dom')?.textContent || 'N/A';
      const telReqs = containerEl.querySelector('#sw-tel-requests')?.textContent || 'N/A';
      const telSlots = containerEl.querySelector('#sw-tel-slots')?.textContent || 'N/A';
      const ssrMs = containerEl.dataset.ssrRenderMs ? `${containerEl.dataset.ssrRenderMs}ms` : 'N/A';

      const report = [
        '# SlotWire Telemetry & Diagnostic Report',
        `- **Route**: ${window.location.pathname}`,
        `- **Environment**: ${options.envTag || 'DEV'}`,
        `- **Load Time**: ${telLoad}`,
        `- **DOM Ready**: ${telDom}`,
        `- **Network Requests**: ${telReqs}`,
        `- **Slots Audited**: ${telSlots}`,
        `- **Server SSR Render**: ${ssrMs}`,
        `- **Timestamp**: ${new Date().toISOString()}`,
      ].join('\n');

      if (navigator.clipboard) {
        navigator.clipboard.writeText(report).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.textContent = 'Copied to Clipboard!';
          copyBtn.classList.add('sw-btn-active');
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('sw-btn-active');
          }, 2000);
        }).catch(() => {});
      }
    });
  }

  // Refresh Telemetry handler
  containerEl.querySelector('#sw-btn-refresh-telemetry')?.addEventListener('click', () => {
    scanAndRender();
  });

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

  // Apply initial overlay and highlight state from storage
  syncOverlayState(areOverlaysVisible);
  syncHighlightState(isHighlightActive);

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
