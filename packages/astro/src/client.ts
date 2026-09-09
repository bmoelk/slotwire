import type { SlotWireConfig, SlotMetadata } from '@slotwire/core';
import { buildCmsDeepLink } from './deep-link.js';
import './vendor/markdown-toolbar.js';

export class SlotWireClient {
  private config: SlotWireConfig;

  constructor(config: SlotWireConfig) {
    this.config = config;
  }

  async getCollection<T = any>(collectionName: string): Promise<T[]> {
    try {
      const url = `${this.config.cms.apiUrl}/api/collections/${collectionName}/content`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn(`[SlotWire Client] Failed to fetch collection '${collectionName}':`, e);
      return [];
    }
  }

  async getSection<T = any>(sectionSlug: string): Promise<T | null> {
    try {
      const url = `${this.config.cms.apiUrl}/api/collections/homepage_sections/content?filter[slug][equals]=${sectionSlug}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0]?.data || json.data?.[0] || null;
    } catch (e) {
      console.warn(`[SlotWire Client] Failed to fetch section '${sectionSlug}':`, e);
      return null;
    }
  }
}

export function createSlotWireClient(config: SlotWireConfig) {
  return new SlotWireClient(config);
}

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
export function introspectPageSlots(): IntrospectedSlot[] {
  const elements = document.querySelectorAll<HTMLElement>('[data-slotwire-slot]');
  const slots: IntrospectedSlot[] = [];

  elements.forEach((el) => {
    let items: IntrospectedSlotChildItem[] | undefined;
    const rawItems = el.getAttribute('data-slotwire-items');
    if (rawItems) {
      try {
        items = JSON.parse(rawItems);
      } catch (e) {}
    }

    slots.push({
      slot: el.getAttribute('data-slotwire-slot') || '',
      archetype: el.getAttribute('data-slotwire-archetype') || undefined,
      collection: el.getAttribute('data-slotwire-collection') || undefined,
      pageSlug: el.getAttribute('data-slotwire-page') || undefined,
      sectionKey: el.getAttribute('data-slotwire-section') || undefined,
      documentId: el.getAttribute('data-slotwire-id') || undefined,
      items,
      isGhost: el.hasAttribute('data-slotwire-ghost') || el.classList.contains('slotwire-ghost-slot'),
      element: el,
    });
  });

  return slots;
}

/**
 * Initializes the in-situ preview workbench:
 * - Collapsible HUD Checklist Drawer
 * - 1-Click Smooth Scroll to Canvas elements
 * - Pre-Create Page Blueprint Cloner
 * - Live EventStream / SSE Slot Morphing
 */
export function initSlotWirePreview(options: { adminUrl?: string; provider?: string } = {}) {
  if (typeof window === 'undefined') return;

  const { adminUrl = '/admin', provider = 'slottd' } = options;

  function updateHud() {
    const slots = introspectPageSlots();
    const totalSlots = slots.length;
    const populatedSlots = slots.filter((s) => !s.isGhost).length;
    const pct = totalSlots > 0 ? Math.round((populatedSlots / totalSlots) * 100) : 100;

    // Update Summary Pill
    const summaryText = document.getElementById('slotwire-hud-summary-text');
    if (summaryText) {
      summaryText.textContent = `${populatedSlots}/${totalSlots} Slots Populated (${pct}%)`;
    }

    // Update Progress Bar
    const progressLabel = document.getElementById('slotwire-hud-progress-label');
    const progressBar = document.getElementById('slotwire-hud-progress-bar');
    if (progressLabel) progressLabel.textContent = `${pct}% (${populatedSlots}/${totalSlots})`;
    if (progressBar) progressBar.style.width = `${pct}%`;

    // Populate Checklist Items
    const listEl = document.getElementById('slotwire-hud-slot-list');
    if (listEl) {
      if (slots.length === 0) {
        listEl.innerHTML = '<div class="py-4 text-center text-zinc-500 font-mono">No <SlotWire /> declarations found on this page.</div>';
        return;
      }

      listEl.innerHTML = slots
        .map((s, idx) => {
          const statusIcon = s.isGhost
            ? '<span class="text-amber-400 font-bold">[ ]</span>'
            : '<span class="text-emerald-400 font-bold">[✓]</span>';
          const badgeClass = s.isGhost
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';

          const editLink = buildCmsDeepLink({
            adminUrl,
            provider,
            collection: s.collection || s.slot,
            documentId: s.documentId,
            pageSlug: s.pageSlug,
            sectionKey: s.sectionKey,
            action: s.isGhost ? 'create' : s.documentId ? 'edit' : 'list',
            archetype: s.archetype as any,
          });

          const createLink = buildCmsDeepLink({
            adminUrl,
            provider,
            collection: s.collection || s.slot,
            pageSlug: s.pageSlug,
            sectionKey: s.sectionKey,
            action: 'create',
            archetype: s.archetype as any,
          });

          const hasChildItems = Boolean(s.items && s.items.length > 0);

          return `
          <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-2.5 transition-all hover:border-zinc-700">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 overflow-hidden">
                ${statusIcon}
                <span class="font-mono font-semibold text-zinc-200 truncate">${s.slot}</span>
                ${s.archetype ? `<span class="rounded px-1.5 py-0.2 font-mono text-[10px] ${badgeClass}">🏷️ ${s.archetype}${hasChildItems ? ` (${s.items!.length})` : ''}</span>` : ''}
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  data-scroll-slot="${s.slot}"
                  class="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  📍 Scroll
                </button>
                ${hasChildItems ? `
                  <a
                    href="${createLink}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="rounded bg-emerald-600/80 hover:bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white"
                    title="Add new ${s.archetype || 'item'} in CMS"
                  >
                    + Add
                  </a>
                  <a
                    href="${editLink}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-zinc-300"
                    title="View collection table"
                  >
                    List ↗
                  </a>
                ` : `
                  <a
                    href="${editLink}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="rounded bg-amber-600/80 hover:bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    ${s.isGhost ? '+ Add' : 'Edit'} ↗
                  </a>
                `}
              </div>
            </div>

            <!-- Expandable Sub-Items List for Composite Slots -->
            ${hasChildItems ? `
              <div class="mt-2 space-y-1 border-t border-zinc-800/80 pt-2 pl-2">
                ${s.items!.map((item, itemIdx) => {
                  const itemEditUrl = buildCmsDeepLink({
                    adminUrl,
                    provider,
                    collection: s.collection || s.slot,
                    documentId: item.id,
                    action: 'edit',
                    archetype: s.archetype as any,
                    pageSlug: s.pageSlug,
                    sectionKey: s.sectionKey,
                  });
                  return `
                  <div class="flex items-center justify-between gap-1 text-[11px]">
                    <span class="text-zinc-400 truncate flex-1">• <strong class="text-zinc-300">${item.label}</strong></span>
                    <a
                      href="${itemEditUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-emerald-400 hover:text-emerald-300 font-mono text-[10px] font-semibold ml-2 shrink-0"
                    >
                      📝 Edit ↗
                    </a>
                  </div>`;
                }).join('')}
              </div>
            ` : ''}

            ${s.sectionKey ? `<div class="mt-1 font-mono text-[10px] text-zinc-500">Section: ${s.sectionKey}</div>` : ''}
          </div>`;
        })
        .join('');


      // Attach Scroll Handlers
      listEl.querySelectorAll<HTMLButtonElement>('[data-scroll-slot]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const slotName = btn.getAttribute('data-scroll-slot');
          const target = document.querySelector<HTMLElement>(`[data-slotwire-slot="${slotName}"]`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-4', 'transition-all', 'duration-300');
            setTimeout(() => {
              target.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-4');
            }, 1500);
          }
        });
      });
    }
  }

  // Overlays Persistence & Toggling
  function getOverlayHiddenState(): boolean {
    return sessionStorage.getItem('slotwire_hide_overlays') === 'true';
  }

  function applyOverlayVisibility(hide: boolean) {
    const overlaysBtn = document.getElementById('slotwire-hud-toggle-overlays-btn');
    if (hide) {
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
      if (overlaysBtn) overlaysBtn.textContent = '🙈 Overlays: OFF';
    } else {
      document.documentElement.classList.remove('slotwire-hide-overlays');
      document.getElementById('sw-hide-style')?.remove();
      sessionStorage.setItem('slotwire_hide_overlays', 'false');
      if (overlaysBtn) overlaysBtn.textContent = '👁️ Overlays: ON';
    }
  }

  // Apply initial overlay state on load
  applyOverlayVisibility(getOverlayHiddenState());

  // Toggle Drawer
  const toggleBtn = document.getElementById('slotwire-hud-toggle-btn');
  const pill = document.getElementById('slotwire-hud-pill');
  const drawer = document.getElementById('slotwire-hud-drawer');
  const closeBtn = document.getElementById('slotwire-hud-close-btn');
  const rescanBtn = document.getElementById('slotwire-hud-rescan-btn');
  const overlaysToggleBtn = document.getElementById('slotwire-hud-toggle-overlays-btn');

  function openDrawer() {
    drawer?.classList.remove('hidden');
    drawer?.classList.add('flex');
  }

  function closeDrawer() {
    drawer?.classList.remove('flex');
    drawer?.classList.add('hidden');
  }

  pill?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id !== 'slotwire-hud-toggle-btn') {
      drawer?.classList.contains('hidden') ? openDrawer() : closeDrawer();
    }
  });

  toggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    drawer?.classList.contains('hidden') ? openDrawer() : closeDrawer();
  });

  closeBtn?.addEventListener('click', closeDrawer);
  rescanBtn?.addEventListener('click', () => {
    updateHud();
  });

  overlaysToggleBtn?.addEventListener('click', () => {
    const isCurrentlyHidden = getOverlayHiddenState();
    applyOverlayVisibility(!isCurrentlyHidden);
  });

  // In-Situ Badges Dragging, Corner Flipping & Minimizing
  function initInSituBadges() {
    const cornerClasses = ['sw-pos-tr', 'sw-pos-br', 'sw-pos-bl', 'sw-pos-tl'];

    document.querySelectorAll<HTMLElement>('.slotwire-in-situ-badge').forEach((badge) => {
      if (badge.dataset.slotwireBound === 'true') return;
      badge.dataset.slotwireBound = 'true';

      const slotKey = badge.dataset.slotKey || '';

      // 1. Minimize / Collapse Handler
      const minBtn = badge.querySelector<HTMLButtonElement>('.slotwire-badge-minimize-btn');
      const expandPill = badge.querySelector<HTMLButtonElement>('.slotwire-badge-minimized-pill');

      minBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        badge.classList.add('is-minimized');
        if (slotKey) sessionStorage.setItem(`sw_min_${slotKey}`, 'true');
      });

      expandPill?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        badge.classList.remove('is-minimized');
        if (slotKey) sessionStorage.setItem(`sw_min_${slotKey}`, 'false');
      });

      // Restore minimized state
      if (slotKey && sessionStorage.getItem(`sw_min_${slotKey}`) === 'true') {
        badge.classList.add('is-minimized');
      }

      // 2. Free Drag Handler
      const dragHandle = badge.querySelector<HTMLElement>('.slotwire-badge-drag');
      if (dragHandle) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;

        dragHandle.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;

          const rect = badge.getBoundingClientRect();
          const containerRect = badge.parentElement?.getBoundingClientRect() || { left: 0, top: 0 };

          initialLeft = rect.left - containerRect.left;
          initialTop = rect.top - containerRect.top;

          badge.classList.remove(...cornerClasses);
          badge.style.right = 'auto';
          badge.style.bottom = 'auto';
          badge.style.left = `${initialLeft}px`;
          badge.style.top = `${initialTop}px`;

          const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isDragging) return;
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            badge.style.left = `${initialLeft + dx}px`;
            badge.style.top = `${initialTop + dy}px`;
          };

          const onMouseUp = () => {
            isDragging = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          };

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        });
      }
    });
  }

  // Initial Run
  initInSituBadges();

  // Keep overlays and badges synced across Astro View Transitions client router navigation
  document.addEventListener('astro:page-load', () => {
    applyOverlayVisibility(getOverlayHiddenState());
    initInSituBadges();
    updateHud();
    initQuickEditDrawer({ adminUrl, provider });
  });
  document.addEventListener('astro:after-swap', () => {
    applyOverlayVisibility(getOverlayHiddenState());
    initInSituBadges();
    updateHud();
    initQuickEditDrawer({ adminUrl, provider });
  });

  // Pre-Create Modal Handler
  const precreateTrigger = document.getElementById('slotwire-precreate-trigger-btn');
  const modal = document.getElementById('slotwire-precreate-modal') as HTMLDialogElement | null;
  const modalClose = document.getElementById('slotwire-modal-close-btn');
  const modalCancel = document.getElementById('slotwire-modal-cancel-btn');
  const modalForm = document.getElementById('slotwire-precreate-form') as HTMLFormElement | null;
  const modalList = document.getElementById('slotwire-modal-blueprint-list');
  const modalError = document.getElementById('slotwire-modal-error');

  function openPreCreateModal() {
    if (!modal) return;
    const activeSlots = introspectPageSlots();
    if (modalList) {
      modalList.innerHTML = activeSlots
        .map(
          (s) =>
            `<div class="flex items-center justify-between"><span>• Slot: <strong>${s.slot}</strong> (${s.collection || 'page_sections'})</span><span class="text-emerald-400">Cascade [✓]</span></div>`
        )
        .join('');
    }
    modal.classList.remove('hidden');
    modal.showModal?.();
  }

  function closePreCreateModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.close?.();
  }

  precreateTrigger?.addEventListener('click', openPreCreateModal);
  modalClose?.addEventListener('click', closePreCreateModal);
  modalCancel?.addEventListener('click', closePreCreateModal);

  modalForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!modalForm) return;

    const formData = new FormData(modalForm);
    const targetTitle = String(formData.get('targetTitle') || '');
    const targetSlug = String(formData.get('targetSlug') || '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');
    const template = String(formData.get('template') || 'standard');
    const addToMenu = formData.get('addToMenu') === 'true' || Boolean(formData.get('addToMenu'));
    const menuKey = String(formData.get('menuKey') || 'header_main');
    const menuLabel = String(formData.get('menuLabel') || '') || targetTitle;

    const submitBtn = document.getElementById('slotwire-modal-submit-btn');
    if (submitBtn) {
      submitBtn.textContent = '🚀 Scaffolding Drafts...';
      (submitBtn as HTMLButtonElement).disabled = true;
    }

    try {
      const activeSlots = introspectPageSlots();
      const payload = {
        archetypeKey: template !== 'active_page' ? template : 'page',
        targetSlug,
        targetTitle,
        template: template !== 'active_page' ? template : 'standard',
        addToMenu,
        menuKey,
        menuLabel,
        slots: activeSlots.map((s) => ({
          slot: s.slot,
          collection: s.collection || 'page_sections',
          sectionKey: s.sectionKey || s.slot,
          strategy: 'cascade',
        })),
      };

      const res = await fetch('/api/slotwire/scaffold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-slotwire-action': 'scaffold',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      const redirectUrl = json.targetUrl || `/${targetSlug}?slotwire_preview=true`;
      window.location.href = redirectUrl;
    } catch (err: any) {
      if (modalError) {
        modalError.textContent = `Scaffolding Error: ${err.message}`;
        modalError.classList.remove('hidden');
      }
      if (submitBtn) {
        submitBtn.textContent = '🚀 Scaffold & Edit Live';
        (submitBtn as HTMLButtonElement).disabled = false;
      }
    }
  });

  // Initial Run
  updateHud();

  // Auto-Highlight Target Slot from Ticket / Deep-Link (e.g. #slotwire-highlight=hero)
  function checkUrlHighlight() {
    const hash = window.location.hash;
    if (hash.includes('slotwire-highlight=')) {
      const slotName = decodeURIComponent(hash.split('slotwire-highlight=')[1].split('&')[0]);
      setTimeout(() => {
        const target = document.querySelector<HTMLElement>(`[data-slotwire-slot="${slotName}"]`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-4', 'transition-all', 'duration-300');
          setTimeout(() => {
            target.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-4');
          }, 3000);
        }
      }, 300);
    }
  }
  checkUrlHighlight();
  window.addEventListener('hashchange', checkUrlHighlight);

  // Listen for Custom Recompile Events
  window.addEventListener('slotwire:recompiled', updateHud);

  // Initialize Quick Edit Drawer
  initQuickEditDrawer({ adminUrl, provider });
}

export interface QuickEditDrawerParams {
  slot: string;
  collection?: string;
  documentId?: string;
  data?: any;
  editUrl?: string;
  slotElement?: HTMLElement | null;
}

/**
 * Initializes the 80/20 in-situ Quick Edit slide-over drawer:
 * - Direct on-page form editing without jumping to the full CMS studio
 * - Featherweight GitHub Markdown Toolbar (<markdown-toolbar>) with native Cmd+Z undo preservation
 * - Live [Write | Preview] tab switcher
 * - Direct mutation dispatcher to POST /api/slotwire/quick-save
 * - Zero-latency optimistic DOM update on save
 */
export function initQuickEditDrawer(options: { adminUrl?: string; provider?: string } = {}) {
  if (typeof window === 'undefined') return;

  const { adminUrl = '/admin' } = options;

  function renderSimpleMarkdown(md: string): string {
    if (!md) return '<p class="text-zinc-500 italic">No content</p>';
    let html = escapeHtml(md);
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-emerald-400 mt-2 mb-1">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-emerald-300 mt-2.5 mb-1">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-white mt-3 mb-1.5">$1</h1>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-2 border-emerald-500 pl-2 text-zinc-400 italic my-1">$1</blockquote>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="text-zinc-200">$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[11px]">$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-400 underline">$1</a>');
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-zinc-300">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-zinc-300">$1</li>');
    html = html.replace(/\n\n+/g, '</p><p class="mt-2 text-zinc-300">');
    html = html.replace(/\n/g, '<br />');
    return `<p class="text-zinc-300">${html}</p>`;
  }

  function escapeHtml(str: string): string {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const root = document.getElementById('slotwire-quick-drawer-root');
  const backdrop = document.getElementById('slotwire-quick-drawer-backdrop');
  const drawer = document.getElementById('slotwire-quick-edit-drawer');
  const closeBtn = document.getElementById('sw-quick-close-btn');
  const cancelBtn = document.getElementById('sw-quick-cancel-btn');
  const saveBtn = document.getElementById('sw-quick-save-btn') as HTMLButtonElement | null;
  const form = document.getElementById('sw-quick-edit-form') as HTMLFormElement | null;
  const fieldsContainer = document.getElementById('sw-quick-fields-container');
  const errorBox = document.getElementById('sw-quick-error');
  const slotBadge = document.getElementById('sw-quick-slot-badge');
  const docIdLabel = document.getElementById('sw-quick-doc-id');
  const escapeHatch = document.getElementById('sw-quick-escape-hatch') as HTMLAnchorElement | null;

  let currentSlot = '';
  let currentCollection = '';
  let currentDocId = '';
  let currentSlotEl: HTMLElement | null = null;

  function closeDrawer() {
    backdrop?.classList.add('hidden');
    drawer?.classList.remove('translate-x-0');
    drawer?.classList.add('translate-x-full');
  }

  function openDrawer(params: QuickEditDrawerParams) {
    currentSlot = params.slot;
    currentCollection = params.collection || params.slot;
    currentDocId = params.documentId || '';
    currentSlotEl = params.slotElement || document.querySelector<HTMLElement>(`[data-slotwire-slot="${params.slot}"]`);

    if (slotBadge) slotBadge.textContent = currentSlot;
    if (docIdLabel) {
      docIdLabel.textContent = currentDocId
        ? `${currentCollection} • id: ${currentDocId}`
        : `${currentCollection} • new`;
    }

    if (escapeHatch) {
      const fallbackUrl = `${adminUrl.replace(/\/+$/, '')}/content/${currentCollection}`;
      escapeHatch.href = params.editUrl || fallbackUrl;
    }

    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.add('hidden');
    }

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>💾 Save Draft</span>';
      saveBtn.className = 'inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-transform active:scale-[0.98]';
    }

    // Derive fields to render
    const fieldMap: Record<string, { label: string; value: any; type: 'string' | 'text' | 'markdown' }> = {};
    const rawData = params.data;

    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      const ignoredKeys = new Set([
        'id', '_id', 'rootId', 'root_id', 'date_created', 'date_updated',
        'user_created', 'user_updated', 'sort', 'status', 'draft_status',
        'items', 'parent', 'authorId',
      ]);

      for (const [k, v] of Object.entries(rawData)) {
        if (ignoredKeys.has(k)) continue;
        if (typeof v === 'object' && v !== null) continue; // Skip complex nested relations in quick edit

        const keyLower = k.toLowerCase();
        let type: 'string' | 'text' | 'markdown' = 'string';
        if (
          keyLower.includes('content') ||
          keyLower.includes('body') ||
          keyLower.includes('markdown') ||
          keyLower.includes('copy') ||
          (typeof v === 'string' && (v.includes('\n') || v.length > 90))
        ) {
          type = 'markdown';
        } else if (
          keyLower.includes('desc') ||
          keyLower.includes('summary') ||
          keyLower.includes('excerpt') ||
          keyLower.includes('subheading') ||
          keyLower.includes('subtitle') ||
          (typeof v === 'string' && v.length > 50)
        ) {
          type = 'text';
        }

        const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        fieldMap[k] = { label, value: v ?? '', type };
      }
    }

    // Fallback: Check for DOM-tagged fields or standard heading/paragraph
    if (Object.keys(fieldMap).length === 0) {
      if (currentSlotEl) {
        const taggedFields = currentSlotEl.querySelectorAll<HTMLElement>('[data-slotwire-field]');
        if (taggedFields.length > 0) {
          taggedFields.forEach((el) => {
            const fieldKey = el.getAttribute('data-slotwire-field') || 'field';
            const label = fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            const text = el.innerText.trim();
            const type = text.includes('\n') || text.length > 80 ? 'markdown' : 'string';
            fieldMap[fieldKey] = { label, value: text, type };
          });
        }
      }

      if (Object.keys(fieldMap).length === 0) {
        const h = currentSlotEl?.querySelector('h1, h2, h3, h4');
        const p = currentSlotEl?.querySelector('p');
        fieldMap['title'] = {
          label: 'Title',
          value: h ? h.textContent?.trim() || '' : '',
          type: 'string',
        };
        fieldMap['content'] = {
          label: 'Content',
          value: p ? p.textContent?.trim() || '' : '',
          type: 'markdown',
        };
      }
    }

    // Render HTML fields into container
    if (fieldsContainer) {
      fieldsContainer.innerHTML = Object.entries(fieldMap)
        .map(([name, f]) => {
          if (f.type === 'markdown') {
            return `
              <div class="space-y-1.5 sw-field-group">
                <div class="flex items-center justify-between">
                  <label for="sw-field-${name}" class="font-mono text-[11px] font-semibold text-zinc-300">
                    ${f.label}
                  </label>
                  <div class="flex items-center rounded bg-zinc-900 border border-zinc-800 p-0.5 text-[10px]">
                    <button type="button" class="sw-tab-write px-2 py-0.5 rounded font-medium bg-zinc-800 text-emerald-400">Write</button>
                    <button type="button" class="sw-tab-preview px-2 py-0.5 rounded font-medium text-zinc-400 hover:text-white">Preview</button>
                  </div>
                </div>

                <div class="sw-write-pane">
                  <markdown-toolbar for="sw-field-${name}" class="flex items-center gap-1 border border-b-0 border-zinc-700 rounded-t-md bg-zinc-900 px-2 py-1 text-zinc-400">
                    <button type="button" data-md-action="bold" class="rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-white font-bold" title="Bold (Cmd+B)">B</button>
                    <button type="button" data-md-action="italic" class="rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-white italic" title="Italic (Cmd+I)">I</button>
                    <button type="button" data-md-action="header" data-level="2" class="rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-white font-bold" title="Heading">H2</button>
                    <button type="button" data-md-action="header" data-level="3" class="rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-white font-bold" title="Subheading">H3</button>
                    <button type="button" data-md-action="link" class="rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-white" title="Link (Cmd+K)">🔗</button>
                    <button type="button" data-md-action="unordered-list" class="rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-white" title="Bullet List">•≡</button>
                    <button type="button" data-md-action="ordered-list" class="rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-white" title="Numbered List">1≡</button>
                    <button type="button" data-md-action="quote" class="rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-white" title="Quote">“</button>
                    <button type="button" data-md-action="code" class="rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-white font-mono" title="Code">&lt;&gt;</button>
                  </markdown-toolbar>
                  <textarea
                    id="sw-field-${name}"
                    name="${name}"
                    rows="6"
                    class="w-full rounded-b-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                  >${escapeHtml(f.value)}</textarea>
                </div>

                <div class="sw-preview-pane hidden rounded-md border border-zinc-700 bg-zinc-900/60 p-3 text-xs text-zinc-200 min-h-[140px] overflow-y-auto">
                </div>
              </div>
            `;
          } else if (f.type === 'text') {
            return `
              <div class="space-y-1.5 sw-field-group">
                <label for="sw-field-${name}" class="block font-mono text-[11px] font-semibold text-zinc-300">
                  ${f.label}
                </label>
                <textarea
                  id="sw-field-${name}"
                  name="${name}"
                  rows="3"
                  class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                >${escapeHtml(f.value)}</textarea>
              </div>
            `;
          } else {
            return `
              <div class="space-y-1.5 sw-field-group">
                <label for="sw-field-${name}" class="block font-mono text-[11px] font-semibold text-zinc-300">
                  ${f.label}
                </label>
                <input
                  type="text"
                  id="sw-field-${name}"
                  name="${name}"
                  value="${escapeHtml(f.value)}"
                  class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            `;
          }
        })
        .join('');

      // Wire Write / Preview tabs
      fieldsContainer.querySelectorAll('.sw-field-group').forEach((group) => {
        const writeBtn = group.querySelector('.sw-tab-write');
        const prevBtn = group.querySelector('.sw-tab-preview');
        const writePane = group.querySelector('.sw-write-pane');
        const prevPane = group.querySelector('.sw-preview-pane');
        const ta = group.querySelector('textarea');

        if (writeBtn && prevBtn && writePane && prevPane && ta) {
          prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            prevPane.innerHTML = renderSimpleMarkdown(ta.value);
            writePane.classList.add('hidden');
            prevPane.classList.remove('hidden');
            prevBtn.classList.add('bg-zinc-800', 'text-emerald-400');
            prevBtn.classList.remove('text-zinc-400');
            writeBtn.classList.remove('bg-zinc-800', 'text-emerald-400');
            writeBtn.classList.add('text-zinc-400');
          });

          writeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            prevPane.classList.add('hidden');
            writePane.classList.remove('hidden');
            writeBtn.classList.add('bg-zinc-800', 'text-emerald-400');
            writeBtn.classList.remove('text-zinc-400');
            prevBtn.classList.remove('bg-zinc-800', 'text-emerald-400');
            prevBtn.classList.add('text-zinc-400');
            ta.focus();
          });
        }
      });
    }

    // Open drawer
    backdrop?.classList.remove('hidden');
    drawer?.classList.remove('translate-x-full');
    drawer?.classList.add('translate-x-0');

    // Auto-focus first input
    setTimeout(() => {
      const firstInput = fieldsContainer?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      firstInput?.focus();
    }, 50);
  }

  // Attach elements handlers (once per drawer element)
  if (root && root.dataset.swBound !== 'true') {
    root.dataset.swBound = 'true';

    closeBtn?.addEventListener('click', closeDrawer);
    cancelBtn?.addEventListener('click', closeDrawer);
    backdrop?.addEventListener('click', closeDrawer);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer && !drawer.classList.contains('translate-x-full')) {
        closeDrawer();
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentDocId) {
        if (errorBox) {
          errorBox.textContent = 'Cannot quick-save: No document ID associated with this slot. Use "Open Full Studio" to create or link the record.';
          errorBox.classList.remove('hidden');
        }
        return;
      }

      const formData = new FormData(form);
      const patchData: Record<string, any> = {};
      formData.forEach((val, key) => {
        patchData[key] = val;
      });

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span>💾 Saving...</span>';
      }
      if (errorBox) {
        errorBox.classList.add('hidden');
        errorBox.textContent = '';
      }

      try {
        const res = await fetch('/api/slotwire/quick-save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-slotwire-action': 'quick-save',
          },
          body: JSON.stringify({
            collection: currentCollection,
            documentId: currentDocId,
            data: patchData,
          }),
        });

        if (!res.ok) {
          let errMsg = `Save failed (${res.status})`;
          try {
            const json = await res.json();
            if (json.error) errMsg = json.error;
          } catch {
            const text = await res.text();
            if (text) errMsg = text;
          }
          throw new Error(errMsg);
        }

        if (saveBtn) {
          saveBtn.innerHTML = '<span>✓ Saved!</span>';
          saveBtn.classList.remove('bg-emerald-600');
          saveBtn.classList.add('bg-emerald-500');
        }

        // Optimistic DOM Updates
        if (currentSlotEl) {
          Object.entries(patchData).forEach(([k, v]) => {
            const fieldEl = currentSlotEl!.querySelector(`[data-slotwire-field="${k}"]`);
            if (fieldEl) {
              fieldEl.textContent = String(v);
            }
          });

          if (patchData.title) {
            const heading = currentSlotEl.querySelector('h1, h2, h3, h4');
            if (heading) heading.textContent = String(patchData.title);
          }

          const bodyVal = patchData.content || patchData.body || patchData.description;
          if (bodyVal) {
            const p = currentSlotEl.querySelector('p, .prose');
            if (p) p.textContent = String(bodyVal);
          }

          const statusTag = currentSlotEl.querySelector('.slotwire-status-tag');
          if (statusTag) {
            statusTag.textContent = 'Draft Modified';
            statusTag.className = 'slotwire-status-tag sw-status-modified';
          }
        }

        // Fire telemetry & update events
        window.dispatchEvent(new CustomEvent('slotwire:recompiled'));
        window.dispatchEvent(new CustomEvent('slotwire:quick-saved', {
          detail: {
            slot: currentSlot,
            collection: currentCollection,
            documentId: currentDocId,
            data: patchData,
          },
        }));

        setTimeout(() => {
          closeDrawer();
        }, 800);
      } catch (err: any) {
        if (errorBox) {
          errorBox.textContent = `Save Error: ${err.message}`;
          errorBox.classList.remove('hidden');
        }
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<span>💾 Save Draft</span>';
        }
      }
    });
  }

  // Global Click Delegate (runs once across whole page lifecycle)
  if (!(window as any).__slotwire_quick_edit_delegate_bound) {
    (window as any).__slotwire_quick_edit_delegate_bound = true;

    document.addEventListener('click', (e) => {
      // 1. Badge "⚡ Edit" button
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.slotwire-badge-quick-edit-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const slot = btn.getAttribute('data-slot') || '';
        const collection = btn.getAttribute('data-collection') || slot;
        const documentId = btn.getAttribute('data-document-id') || '';
        const editUrl = btn.getAttribute('data-edit-url') || '';
        let data: any = null;
        try {
          const raw = btn.getAttribute('data-slot-data');
          if (raw) data = JSON.parse(raw);
        } catch {}
        const container = btn.closest<HTMLElement>('.slotwire-slot-container') || document.querySelector<HTMLElement>(`[data-slotwire-slot="${slot}"]`);
        openDrawer({ slot, collection, documentId, data, editUrl, slotElement: container });
        return;
      }

      // 2. Inspector "⚡ Quick" button
      const inspectorBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('.sw-quick-edit-trigger');
      if (inspectorBtn) {
        e.preventDefault();
        e.stopPropagation();
        const slotItem = inspectorBtn.closest('.sw-slot-item');
        const nameEl = slotItem?.querySelector('.sw-slot-name');
        const slotName = (nameEl?.textContent || '').replace(/^#/, '').trim();
        if (slotName) {
          const container = document.querySelector<HTMLElement>(`[data-slotwire-slot="${slotName}"]`);
          const badgeBtn = container?.querySelector<HTMLButtonElement>('.slotwire-badge-quick-edit-btn');
          if (badgeBtn) {
            badgeBtn.click();
          } else if (container) {
            const collection = container.getAttribute('data-slotwire-collection') || slotName;
            const documentId = container.getAttribute('data-slotwire-id') || '';
            const editUrl = container.getAttribute('data-slotwire-edit-url') || '';
            openDrawer({ slot: slotName, collection, documentId, data: null, editUrl, slotElement: container });
          }
        }
        return;
      }
    });

    window.addEventListener('slotwire:open-quick-edit', (e: any) => {
      if (e.detail) {
        openDrawer(e.detail);
      }
    });
  }

  (window as any).__slotwire_open_quick_drawer = openDrawer;

  return {
    open: openDrawer,
    close: closeDrawer,
  };
}

/**
 * Live Slot Morphing helper using document.startViewTransition
 */
export async function morphSlotElement(slotKey: string, newHtml: string) {
  const target = document.querySelector<HTMLElement>(`[data-slotwire-slot="${slotKey}"]`);
  if (!target) return false;

  if (document.startViewTransition) {
    document.startViewTransition(() => {
      target.outerHTML = newHtml;
    });
  } else {
    target.outerHTML = newHtml;
  }

  window.dispatchEvent(new CustomEvent('slotwire:recompiled'));
  return true;
}
