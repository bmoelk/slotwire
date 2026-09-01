import type { SlotWireConfig, SlotMetadata } from '@slotwire/core';
import { buildCmsDeepLink } from './deep-link.js';

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

  const { adminUrl = 'https://cms.brainendeavor.com/admin', provider = 'sonicjs' } = options;

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
  });
  document.addEventListener('astro:after-swap', () => {
    applyOverlayVisibility(getOverlayHiddenState());
    initInSituBadges();
    updateHud();
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
