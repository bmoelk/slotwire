import { buildCmsDeepLink } from './deep-link.js';
import './vendor/markdown-toolbar.js';
import { initPell } from './vendor/pell.js';
export class SlotWireClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async getCollection(collectionName) {
        try {
            const url = `${this.config.cms.apiUrl}/api/collections/${collectionName}/content`;
            const res = await fetch(url);
            if (!res.ok)
                return [];
            const json = await res.json();
            return json.data || [];
        }
        catch (e) {
            console.warn(`[SlotWire Client] Failed to fetch collection '${collectionName}':`, e);
            return [];
        }
    }
    async getSection(sectionSlug) {
        try {
            const url = `${this.config.cms.apiUrl}/api/collections/homepage_sections/content?filter[slug][equals]=${sectionSlug}`;
            const res = await fetch(url);
            if (!res.ok)
                return null;
            const json = await res.json();
            return json.data?.[0]?.data || json.data?.[0] || null;
        }
        catch (e) {
            console.warn(`[SlotWire Client] Failed to fetch section '${sectionSlug}':`, e);
            return null;
        }
    }
}
export function createSlotWireClient(config) {
    return new SlotWireClient(config);
}
/**
 * Scans the current DOM for all active SlotWire slots and ghost wireframes.
 */
export function introspectPageSlots() {
    const elements = document.querySelectorAll('[data-slotwire-slot]');
    const slots = [];
    elements.forEach((el) => {
        let items;
        const rawItems = el.getAttribute('data-slotwire-items');
        if (rawItems) {
            try {
                items = JSON.parse(rawItems);
            }
            catch (e) { }
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
export function initSlotWirePreview(options = {}) {
    if (typeof window === 'undefined')
        return;
    const { adminUrl = '/admin', provider = 'slottd', editor } = options;
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
        if (progressLabel)
            progressLabel.textContent = `${pct}% (${populatedSlots}/${totalSlots})`;
        if (progressBar)
            progressBar.style.width = `${pct}%`;
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
                    archetype: s.archetype,
                });
                const createLink = buildCmsDeepLink({
                    adminUrl,
                    provider,
                    collection: s.collection || s.slot,
                    pageSlug: s.pageSlug,
                    sectionKey: s.sectionKey,
                    action: 'create',
                    archetype: s.archetype,
                });
                const hasChildItems = Boolean(s.items && s.items.length > 0);
                return `
          <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-2.5 transition-all hover:border-zinc-700">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 overflow-hidden">
                ${statusIcon}
                <span class="font-mono font-semibold text-zinc-200 truncate">${s.slot}</span>
                ${s.archetype ? `<span class="rounded px-1.5 py-0.2 font-mono text-[10px] ${badgeClass}">🏷️ ${s.archetype}${hasChildItems ? ` (${s.items.length})` : ''}</span>` : ''}
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
                ${s.items.map((item, itemIdx) => {
                    const itemEditUrl = buildCmsDeepLink({
                        adminUrl,
                        provider,
                        collection: s.collection || s.slot,
                        documentId: item.id,
                        action: 'edit',
                        archetype: s.archetype,
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
            listEl.querySelectorAll('[data-scroll-slot]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const slotName = btn.getAttribute('data-scroll-slot');
                    const target = document.querySelector(`[data-slotwire-slot="${slotName}"]`);
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
    function getOverlayHiddenState() {
        return sessionStorage.getItem('slotwire_hide_overlays') === 'true';
    }
    function applyOverlayVisibility(hide) {
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
            if (overlaysBtn)
                overlaysBtn.textContent = '🙈 Overlays: OFF';
        }
        else {
            document.documentElement.classList.remove('slotwire-hide-overlays');
            document.getElementById('sw-hide-style')?.remove();
            sessionStorage.setItem('slotwire_hide_overlays', 'false');
            if (overlaysBtn)
                overlaysBtn.textContent = '👁️ Overlays: ON';
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
        drawer?.classList.add('open');
    }
    function closeDrawer() {
        drawer?.classList.remove('flex');
        drawer?.classList.remove('open');
        drawer?.classList.add('hidden');
    }
    pill?.addEventListener('click', (e) => {
        if (e.target.id !== 'slotwire-hud-toggle-btn') {
            (drawer?.classList.contains('hidden') || !drawer?.classList.contains('open')) ? openDrawer() : closeDrawer();
        }
    });
    toggleBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        (drawer?.classList.contains('hidden') || !drawer?.classList.contains('open')) ? openDrawer() : closeDrawer();
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
        document.querySelectorAll('.slotwire-in-situ-badge').forEach((badge) => {
            if (badge.dataset.slotwireBound === 'true')
                return;
            badge.dataset.slotwireBound = 'true';
            const slotKey = badge.dataset.slotKey || '';
            // 1. Minimize / Collapse Handler
            const minBtn = badge.querySelector('.slotwire-badge-minimize-btn');
            const expandPill = badge.querySelector('.slotwire-badge-minimized-pill');
            minBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                badge.classList.add('is-minimized');
                if (slotKey)
                    sessionStorage.setItem(`sw_min_${slotKey}`, 'true');
            });
            expandPill?.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                badge.classList.remove('is-minimized');
                if (slotKey)
                    sessionStorage.setItem(`sw_min_${slotKey}`, 'false');
            });
            // Restore minimized state
            if (slotKey && sessionStorage.getItem(`sw_min_${slotKey}`) === 'true') {
                badge.classList.add('is-minimized');
            }
            // 2. Free Drag Handler
            const dragHandle = badge.querySelector('.slotwire-badge-drag');
            if (dragHandle) {
                let isDragging = false;
                let startX = 0;
                let startY = 0;
                let initialLeft = 0;
                let initialTop = 0;
                dragHandle.addEventListener('mousedown', (e) => {
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
                    const onMouseMove = (moveEvent) => {
                        if (!isDragging)
                            return;
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
        initQuickEditDrawer({ adminUrl, provider, editor });
    });
    document.addEventListener('astro:after-swap', () => {
        applyOverlayVisibility(getOverlayHiddenState());
        initInSituBadges();
        updateHud();
        initQuickEditDrawer({ adminUrl, provider, editor });
    });
    // Pre-Create Modal Handler
    const precreateTrigger = document.getElementById('slotwire-precreate-trigger-btn');
    const modal = document.getElementById('slotwire-precreate-modal');
    const modalClose = document.getElementById('slotwire-modal-close-btn');
    const modalCancel = document.getElementById('slotwire-modal-cancel-btn');
    const modalForm = document.getElementById('slotwire-precreate-form');
    const modalList = document.getElementById('slotwire-modal-blueprint-list');
    const modalError = document.getElementById('slotwire-modal-error');
    function openPreCreateModal() {
        if (!modal)
            return;
        const activeSlots = introspectPageSlots();
        if (modalList) {
            modalList.innerHTML = activeSlots
                .map((s) => `<div class="flex items-center justify-between"><span>• Slot: <strong>${s.slot}</strong> (${s.collection || 'page_sections'})</span><span class="text-emerald-400">Cascade [✓]</span></div>`)
                .join('');
        }
        modal.classList.remove('hidden');
        modal.showModal?.();
    }
    function closePreCreateModal() {
        if (!modal)
            return;
        modal.classList.add('hidden');
        modal.close?.();
    }
    precreateTrigger?.addEventListener('click', openPreCreateModal);
    modalClose?.addEventListener('click', closePreCreateModal);
    modalCancel?.addEventListener('click', closePreCreateModal);
    modalForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!modalForm)
            return;
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
            submitBtn.disabled = true;
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
        }
        catch (err) {
            if (modalError) {
                modalError.textContent = `Scaffolding Error: ${err.message}`;
                modalError.classList.remove('hidden');
            }
            if (submitBtn) {
                submitBtn.textContent = '🚀 Scaffold & Edit Live';
                submitBtn.disabled = false;
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
                const target = document.querySelector(`[data-slotwire-slot="${slotName}"]`);
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
    initQuickEditDrawer({ adminUrl, provider, editor });
}
export const SlotWireAuthManager = {
    getStorageKey(apiUrl) {
        const clean = (apiUrl || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/[:.]/g, '_');
        return `slotwire_auth_${clean || 'default'}`;
    },
    getToken(apiUrl) {
        try {
            return localStorage.getItem(this.getStorageKey(apiUrl)) || null;
        }
        catch {
            return null;
        }
    },
    getUser(apiUrl) {
        try {
            const raw = localStorage.getItem(`${this.getStorageKey(apiUrl)}_user`);
            return raw ? JSON.parse(raw) : null;
        }
        catch {
            return null;
        }
    },
    setAuth(apiUrl, token, user) {
        try {
            localStorage.setItem(this.getStorageKey(apiUrl), token);
            localStorage.setItem(`${this.getStorageKey(apiUrl)}_user`, JSON.stringify(user));
        }
        catch { }
    },
    clearAuth(apiUrl) {
        try {
            localStorage.removeItem(this.getStorageKey(apiUrl));
            localStorage.removeItem(`${this.getStorageKey(apiUrl)}_user`);
        }
        catch { }
    },
    async checkAuth(apiUrl, provider) {
        const token = this.getToken(apiUrl);
        if (!token) {
            return { authenticated: false };
        }
        const cleanApi = (apiUrl || '').replace(/\/+$/, '');
        const probeUrl = provider === 'wordpress' ? `${cleanApi}/wp-json/wp/v2/users/me` : `${cleanApi}/ext/auth/me`;
        try {
            const res = await fetch(probeUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const json = await res.json().catch(() => ({}));
                const user = json.user || { email: json.email || json.name || 'operator' };
                this.setAuth(apiUrl, token, user);
                return { authenticated: true, user };
            }
            else {
                this.clearAuth(apiUrl);
                return { authenticated: false };
            }
        }
        catch {
            const cachedUser = this.getUser(apiUrl);
            if (cachedUser) {
                return { authenticated: true, user: cachedUser };
            }
            return { authenticated: false };
        }
    },
    openAuthPopup(apiUrl, provider) {
        return new Promise((resolve, reject) => {
            const cleanApi = (apiUrl || '').replace(/\/+$/, '');
            const returnOrigin = window.location.origin;
            const loginUrl = provider === 'wordpress'
                ? `${cleanApi}/wp-login.php?slotwire_auth=1&origin=${encodeURIComponent(returnOrigin)}`
                : `${cleanApi}/admin/login?slotwire_auth=1&origin=${encodeURIComponent(returnOrigin)}`;
            const w = 500;
            const h = 650;
            const left = Math.max(0, (window.screen.width - w) / 2);
            const top = Math.max(0, (window.screen.height - h) / 2);
            const popup = window.open(loginUrl, 'slotwire_cms_auth', `width=${w},height=${h},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`);
            if (!popup) {
                alert('Please allow popups for this site to sign in to the CMS.');
                return reject(new Error('Popup blocked'));
            }
            const onMessage = (event) => {
                if (event.data && event.data.type === 'slotwire:auth_success') {
                    window.removeEventListener('message', onMessage);
                    const token = event.data.token;
                    const user = {
                        email: event.data.email || 'operator',
                        name: event.data.name,
                        provider: event.data.provider || provider,
                    };
                    SlotWireAuthManager.setAuth(apiUrl, token, user);
                    resolve({ token, user });
                }
            };
            window.addEventListener('message', onMessage);
            const timer = setInterval(() => {
                if (popup.closed) {
                    clearInterval(timer);
                    window.removeEventListener('message', onMessage);
                }
            }, 500);
        });
    },
};
/**
 * Initializes the 80/20 in-situ Quick Edit slide-over drawer:
 * - Direct on-page form editing without jumping to the full CMS studio
 * - Featherweight GitHub Markdown Toolbar (<markdown-toolbar>) with native Cmd+Z undo preservation
 * - Live [Write | Preview] tab switcher
 * - Direct mutation dispatcher to POST /api/slotwire/quick-save
 * - Zero-latency optimistic DOM update on save
 */
export function initQuickEditDrawer(options = {}) {
    if (typeof window === 'undefined')
        return;
    const { adminUrl = '/admin' } = options;
    function renderSimpleMarkdown(md) {
        if (!md)
            return '<p class="text-zinc-500 italic">No content</p>';
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
    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    const root = document.getElementById('slotwire-quick-drawer-root');
    const configuredApiUrl = root?.getAttribute('data-api-url') ||
        options.apiUrl ||
        (options.provider === 'slottd' ? 'http://localhost:8787' : '');
    const configuredProvider = root?.getAttribute('data-provider') ||
        options.provider ||
        'slottd';
    const configuredAdminUrl = root?.getAttribute('data-admin-url') ||
        options.adminUrl ||
        adminUrl ||
        configuredApiUrl ||
        '/admin';
    const configuredEditor = root?.getAttribute('data-editor') ||
        options.editor ||
        (configuredProvider === 'wordpress' ? 'html' : 'markdown');
    const backdrop = document.getElementById('slotwire-quick-drawer-backdrop');
    const drawer = document.getElementById('slotwire-quick-edit-drawer');
    const closeBtn = document.getElementById('sw-quick-close-btn');
    const cancelBtn = document.getElementById('sw-quick-cancel-btn');
    const saveBtn = document.getElementById('sw-quick-save-btn');
    const form = document.getElementById('sw-quick-edit-form');
    const fieldsContainer = document.getElementById('sw-quick-fields-container');
    const errorBox = document.getElementById('sw-quick-error');
    const slotBadge = document.getElementById('sw-quick-slot-badge');
    const docIdLabel = document.getElementById('sw-quick-doc-id');
    const escapeHatch = document.getElementById('sw-quick-escape-hatch');
    let currentSlot = '';
    let currentCollection = '';
    let currentDocId = '';
    let currentSlotEl = null;
    async function updateDrawerAuthState() {
        const authCard = document.getElementById('sw-quick-auth-card');
        const userChip = document.getElementById('sw-quick-user-chip');
        const userEmailSpan = document.getElementById('sw-quick-user-email');
        const loginBtn = document.getElementById('sw-quick-login-btn');
        const signoutBtn = document.getElementById('sw-quick-signout-btn');
        const sBtn = document.getElementById('sw-quick-save-btn') || saveBtn;
        const activeFc = document.getElementById('sw-quick-fields-container') || fieldsContainer;
        if (loginBtn && loginBtn.dataset.swBound !== 'true') {
            loginBtn.dataset.swBound = 'true';
            loginBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    loginBtn.textContent = 'Connecting...';
                    await SlotWireAuthManager.openAuthPopup(configuredApiUrl, configuredProvider);
                    await updateDrawerAuthState();
                }
                catch (err) {
                    console.error('[SlotWire Auth] Login failed:', err);
                }
                finally {
                    loginBtn.innerHTML = '🔑 Sign in to CMS ↗';
                }
            });
        }
        if (signoutBtn && signoutBtn.dataset.swBound !== 'true') {
            signoutBtn.dataset.swBound = 'true';
            signoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                SlotWireAuthManager.clearAuth(configuredApiUrl);
                await updateDrawerAuthState();
            });
        }
        const authStatus = await SlotWireAuthManager.checkAuth(configuredApiUrl, configuredProvider);
        if (authStatus.authenticated && authStatus.user) {
            authCard?.classList.add('hidden');
            userChip?.classList.remove('hidden');
            if (userEmailSpan) {
                userEmailSpan.textContent = authStatus.user.email;
            }
            activeFc?.querySelectorAll('input, textarea').forEach((input) => {
                input.disabled = false;
            });
            if (sBtn && currentDocId) {
                sBtn.disabled = false;
                sBtn.title = '';
                sBtn.innerHTML = '<span>🚀 Publish Changes</span>';
                sBtn.style.opacity = '';
                sBtn.style.cursor = '';
            }
        }
        else {
            authCard?.classList.remove('hidden');
            userChip?.classList.add('hidden');
            activeFc?.querySelectorAll('input, textarea').forEach((input) => {
                input.disabled = true;
            });
            if (sBtn) {
                sBtn.disabled = true;
                sBtn.title = 'Sign in to CMS required to publish';
                sBtn.innerHTML = '<span>🔒 Sign in to Publish</span>';
                sBtn.style.opacity = '0.6';
                sBtn.style.cursor = 'not-allowed';
            }
        }
    }
    function applySavedDrawerWidth(targetDrawer) {
        if (!targetDrawer)
            return;
        try {
            const savedWidth = localStorage.getItem('slotwire_drawer_width');
            if (savedWidth) {
                const w = parseInt(savedWidth, 10);
                if (!isNaN(w) && w >= 320 && w <= window.innerWidth - 20) {
                    targetDrawer.style.width = `${w}px`;
                    targetDrawer.style.maxWidth = `${w}px`;
                }
            }
        }
        catch { }
    }
    applySavedDrawerWidth(drawer);
    function closeDrawer() {
        const bd = document.getElementById('slotwire-quick-drawer-backdrop') || backdrop;
        const dr = document.getElementById('slotwire-quick-edit-drawer') || drawer;
        bd?.classList.remove('sw-open');
        bd?.classList.add('hidden');
        dr?.classList.remove('sw-open');
        dr?.classList.remove('translate-x-0');
        dr?.classList.add('translate-x-full');
    }
    /**
     * Resolves the specific child card/item element within a composite slot container
     * using a multi-tiered heuristic strategy:
     * 1. Direct attribute match ([data-slotwire-item-id], [data-id], [id], [data-slug])
     * 2. Original heading/title match before edit
     * 3. Link URL / destinationUrl / githubUrl match
     * 4. Index-based child resolution within grid/list container
     */
    function resolveChildCardElement(container, docId, originalData, itemIndex, itemSlug, originalTitle) {
        if (!container)
            return null;
        // Helper: verify element is in rendered slot content, NOT inside the in-situ badge or popover
        const isContentEl = (el) => {
            if (!el)
                return false;
            return !el.closest('.slotwire-in-situ-badge') && !el.closest('.slotwire-composite-popover');
        };
        // 1. Direct attribute match on the item card or child element by ID
        if (docId) {
            const allMatches = Array.from(container.querySelectorAll(`[data-slotwire-item-id="${docId}"], [data-id="${docId}"], [data-item-id="${docId}"], [id="${docId}"]`)).filter(isContentEl);
            for (const m of allMatches) {
                const card = m.closest('[data-slotwire-item-id], [class*="card"], [class*="item"], article, li, a');
                if (card && card !== container && isContentEl(card)) {
                    return card;
                }
                return m;
            }
        }
        // 1b. Direct slug match
        if (itemSlug) {
            const allMatches = Array.from(container.querySelectorAll(`[data-slotwire-item-slug="${itemSlug}"], [data-slug="${itemSlug}"], [data-item-slug="${itemSlug}"]`)).filter(isContentEl);
            for (const m of allMatches) {
                const card = m.closest('[data-slotwire-item-id], [class*="card"], [class*="item"], article, li, a');
                if (card && card !== container && isContentEl(card)) {
                    return card;
                }
                return m;
            }
        }
        // 1c. Direct index attribute match
        if (itemIndex !== undefined && !isNaN(itemIndex) && itemIndex >= 0) {
            const indexMatch = container.querySelector(`[data-slotwire-item-index="${itemIndex}"]`);
            if (indexMatch && isContentEl(indexMatch)) {
                return indexMatch;
            }
        }
        // 2. Heading text match against originalTitle / originalData.title / originalData.name
        const testTitle = (originalTitle || originalData?.title || originalData?.name || originalData?.heading || '').trim().toLowerCase();
        if (testTitle) {
            const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).filter(isContentEl);
            for (const h of headings) {
                const hText = (h.textContent || '').trim().toLowerCase();
                if (hText === testTitle || hText.startsWith(testTitle) || testTitle.startsWith(hText)) {
                    const card = h.closest('article, li, [class*="card"], [class*="rounded"], .grid > *, .flex > *, a');
                    if (card && card !== container && isContentEl(card)) {
                        return card;
                    }
                    return h.parentElement;
                }
            }
        }
        // 3. Link URL match against destinationUrl / githubUrl / slug / url
        const testUrl = (originalData?.destinationUrl || originalData?.githubUrl || originalData?.url || originalData?.link || '').trim();
        if (testUrl && testUrl !== '#') {
            const links = Array.from(container.querySelectorAll('a[href]')).filter(isContentEl);
            for (const a of links) {
                const href = a.getAttribute('href') || '';
                if (href === testUrl || href.endsWith(testUrl) || testUrl.endsWith(href)) {
                    const card = a.closest('article, li, [class*="card"], [class*="rounded"], .grid > *, .flex > *');
                    if (card && card !== container && isContentEl(card)) {
                        return card;
                    }
                    return a;
                }
            }
        }
        // 4. Index-based child resolution
        if (itemIndex !== undefined && !isNaN(itemIndex) && itemIndex >= 0) {
            const listContainers = Array.from(container.querySelectorAll('.grid, [class*="grid-cols"], ul, ol, [class*="flex-wrap"], [class*="gap-"]')).filter(isContentEl);
            for (const lc of listContainers) {
                const children = Array.from(lc.children).filter(isContentEl);
                if (children.length > itemIndex) {
                    return children[itemIndex];
                }
            }
            const directChildren = Array.from(container.children).filter(isContentEl);
            if (directChildren.length > itemIndex) {
                return directChildren[itemIndex];
            }
        }
        return null;
    }
    function openDrawer(params) {
        const bd = document.getElementById('slotwire-quick-drawer-backdrop') || backdrop;
        const dr = document.getElementById('slotwire-quick-edit-drawer') || drawer;
        applySavedDrawerWidth(dr);
        const sb = document.getElementById('sw-quick-slot-badge') || slotBadge;
        const dl = document.getElementById('sw-quick-doc-id') || docIdLabel;
        const eh = document.getElementById('sw-quick-escape-hatch') || escapeHatch;
        const fc = document.getElementById('sw-quick-fields-container') || fieldsContainer;
        const eb = document.getElementById('sw-quick-error') || errorBox;
        const sBtn = document.getElementById('sw-quick-save-btn') || saveBtn;
        currentSlot = params.slot;
        currentSlotEl = params.slotElement || document.querySelector(`[data-slotwire-slot="${params.slot}"]`);
        currentCollection =
            params.collection ||
                currentSlotEl?.getAttribute('data-slotwire-collection') ||
                params.slot;
        currentDocId =
            params.documentId ||
                params.data?.id ||
                params.data?.rootId ||
                params.data?.root_id ||
                params.data?.slug ||
                currentSlotEl?.getAttribute('data-slotwire-id') ||
                '';
        // Persist to form dataset and window global state to eliminate multi-instance closure drift
        const activeFormEl = document.getElementById('sw-quick-edit-form') || form;
        if (activeFormEl) {
            activeFormEl.dataset.slot = currentSlot;
            activeFormEl.dataset.collection = currentCollection;
            activeFormEl.dataset.documentId = currentDocId;
            if (params.itemIndex !== undefined)
                activeFormEl.dataset.itemIndex = String(params.itemIndex);
            else
                delete activeFormEl.dataset.itemIndex;
            if (params.itemSlug)
                activeFormEl.dataset.itemSlug = params.itemSlug;
            else
                delete activeFormEl.dataset.itemSlug;
            if (params.itemTitle)
                activeFormEl.dataset.itemTitle = params.itemTitle;
            else
                delete activeFormEl.dataset.itemTitle;
        }
        if (sBtn) {
            sBtn.dataset.slot = currentSlot;
            sBtn.dataset.collection = currentCollection;
            sBtn.dataset.documentId = currentDocId;
            if (params.itemIndex !== undefined)
                sBtn.dataset.itemIndex = String(params.itemIndex);
            else
                delete sBtn.dataset.itemIndex;
            if (params.itemSlug)
                sBtn.dataset.itemSlug = params.itemSlug;
            else
                delete sBtn.dataset.itemSlug;
            if (params.itemTitle)
                sBtn.dataset.itemTitle = params.itemTitle;
            else
                delete sBtn.dataset.itemTitle;
        }
        window.__slotwire_drawer_state = {
            slot: currentSlot,
            collection: currentCollection,
            documentId: currentDocId,
            data: params.data,
            editUrl: params.editUrl || '',
            slotElement: currentSlotEl,
            itemIndex: params.itemIndex,
            itemSlug: params.itemSlug,
            itemTitle: params.itemTitle,
        };
        if (sb) {
            const itemTitle = params.data?.title || params.data?.label || params.data?.name;
            sb.textContent = itemTitle ? `${currentSlot} / ${itemTitle}` : currentSlot;
        }
        if (dl) {
            dl.textContent = currentDocId
                ? `${currentCollection} • id: ${currentDocId}`
                : `${currentCollection} • unlinked`;
        }
        if (eh) {
            const fallbackUrl = `${adminUrl.replace(/\/+$/, '')}/content/${currentCollection}`;
            eh.href = params.editUrl || fallbackUrl;
        }
        if (!currentDocId) {
            if (eb) {
                eb.innerHTML = `<span>⚠️ This slot is using template fallback data and has not yet been linked to a CMS document. Quick edit requires an existing CMS record. Use <a href="${eh?.href || '#'}" target="_blank" rel="noopener noreferrer" style="color:#34d399;text-decoration:underline;">Open Full CMS ↗</a> to create it.</span>`;
                eb.classList.remove('hidden');
                eb.style.display = 'block';
            }
            if (sBtn) {
                sBtn.disabled = true;
                sBtn.title = 'Cannot publish: Document does not exist in CMS yet';
                sBtn.innerHTML = '<span>⚠️ Unlinked Slot</span>';
                sBtn.style.opacity = '0.5';
                sBtn.style.cursor = 'not-allowed';
            }
        }
        else {
            if (eb) {
                eb.textContent = '';
                eb.classList.add('hidden');
                eb.style.display = 'none';
            }
            if (sBtn) {
                sBtn.disabled = false;
                sBtn.title = '';
                sBtn.style.opacity = '';
                sBtn.style.cursor = '';
                sBtn.innerHTML = '<span>🚀 Publish Changes</span>';
                sBtn.className = 'sw-quick-save-btn';
            }
        }
        // Derive fields to render
        const fieldMap = {};
        const rawData = params.data;
        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
            const ignoredKeys = new Set([
                'id', '_id', 'rootId', 'root_id', 'date_created', 'date_updated',
                'user_created', 'user_updated', 'sort', 'status', 'draft_status',
                'items', 'parent', 'authorId',
            ]);
            for (const [k, v] of Object.entries(rawData)) {
                if (ignoredKeys.has(k))
                    continue;
                if (typeof v === 'object' && v !== null)
                    continue; // Skip complex nested relations in quick edit
                const keyLower = k.toLowerCase();
                let type = 'string';
                if (keyLower.includes('content') ||
                    keyLower.includes('body') ||
                    keyLower.includes('markdown') ||
                    keyLower.includes('copy') ||
                    (typeof v === 'string' && (v.includes('\n') || v.length > 90))) {
                    type = 'markdown';
                }
                else if (keyLower.includes('desc') ||
                    keyLower.includes('summary') ||
                    keyLower.includes('excerpt') ||
                    keyLower.includes('subheading') ||
                    keyLower.includes('subtitle') ||
                    (typeof v === 'string' && v.length > 50)) {
                    type = 'text';
                }
                const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                fieldMap[k] = { label, value: v ?? '', type };
            }
        }
        // Fallback: Check for DOM-tagged fields or standard heading/paragraph
        if (Object.keys(fieldMap).length === 0) {
            if (currentSlotEl) {
                const taggedFields = currentSlotEl.querySelectorAll('[data-slotwire-field]');
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
        if (fc) {
            fc.innerHTML = Object.entries(fieldMap)
                .map(([name, f]) => {
                if (f.type === 'markdown') {
                    if (configuredEditor === 'html') {
                        return `
              <div class="space-y-1.5 sw-field-group" data-field-type="html">
                <label for="sw-field-${name}" class="block font-mono text-[11px] font-semibold text-zinc-300">
                  ${f.label} <span class="text-zinc-500 font-normal">(HTML)</span>
                </label>
                <div id="sw-pell-${name}" class="sw-pell-container"></div>
                <input type="hidden" id="sw-field-${name}" name="${name}" value="${escapeHtml(f.value)}" />
              </div>
              `;
                    }
                    return `
              <div class="space-y-1.5 sw-field-group" data-field-type="markdown">
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
                }
                else if (f.type === 'text') {
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
                }
                else {
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
            fc.querySelectorAll('.sw-field-group').forEach((group) => {
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
            // Initialize Pell for HTML fields when configuredEditor === 'html'
            if (configuredEditor === 'html') {
                Object.entries(fieldMap).forEach(([name, f]) => {
                    if (f.type === 'markdown') {
                        const pellEl = fc.querySelector(`#sw-pell-${name}`);
                        const hiddenInput = fc.querySelector(`#sw-field-${name}`);
                        if (pellEl && hiddenInput) {
                            initPell({
                                element: pellEl,
                                initialHtml: String(f.value || ''),
                                onChange: (html) => {
                                    hiddenInput.value = html;
                                },
                            });
                        }
                    }
                });
            }
        }
        // Check and update CMS auth state
        updateDrawerAuthState();
        // Open drawer
        bd?.classList.add('sw-open');
        bd?.classList.remove('hidden');
        dr?.classList.add('sw-open');
        dr?.classList.remove('translate-x-full');
        dr?.classList.add('translate-x-0');
        // Auto-focus first input
        setTimeout(() => {
            const firstInput = fc?.querySelector('input, textarea');
            firstInput?.focus();
        }, 50);
    }
    // Attach elements handlers (once per drawer element)
    const activeRoot = document.getElementById('slotwire-quick-drawer-root') || root;
    if (activeRoot && activeRoot.dataset.swBound !== 'true') {
        activeRoot.dataset.swBound = 'true';
        const activeClose = document.getElementById('sw-quick-close-btn') || closeBtn;
        const activeCancel = document.getElementById('sw-quick-cancel-btn') || cancelBtn;
        const activeBackdrop = document.getElementById('slotwire-quick-drawer-backdrop') || backdrop;
        const resizeHandle = document.getElementById('sw-quick-resize-handle');
        if (resizeHandle) {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            const onMouseDown = (e) => {
                if (e.button !== 0)
                    return;
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                const activeDr = document.getElementById('slotwire-quick-edit-drawer') || drawer;
                startWidth = activeDr ? activeDr.getBoundingClientRect().width : 440;
                resizeHandle.classList.add('sw-resizing');
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                const onMouseMove = (moveEv) => {
                    if (!isResizing)
                        return;
                    const delta = startX - moveEv.clientX;
                    const minW = 320;
                    const maxW = Math.max(window.innerWidth - 32, minW);
                    const newWidth = Math.min(Math.max(startWidth + delta, minW), maxW);
                    const currentDr = document.getElementById('slotwire-quick-edit-drawer') || drawer;
                    if (currentDr) {
                        currentDr.style.width = `${Math.round(newWidth)}px`;
                        currentDr.style.maxWidth = `${Math.round(newWidth)}px`;
                    }
                };
                const onMouseUp = () => {
                    if (!isResizing)
                        return;
                    isResizing = false;
                    resizeHandle.classList.remove('sw-resizing');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    const currentDr = document.getElementById('slotwire-quick-edit-drawer') || drawer;
                    if (currentDr) {
                        const finalWidth = Math.round(currentDr.getBoundingClientRect().width);
                        try {
                            localStorage.setItem('slotwire_drawer_width', String(finalWidth));
                        }
                        catch { }
                    }
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
            resizeHandle.addEventListener('mousedown', onMouseDown);
        }
        activeClose?.addEventListener('click', closeDrawer);
        activeCancel?.addEventListener('click', closeDrawer);
        activeBackdrop?.addEventListener('click', closeDrawer);
        window.addEventListener('keydown', (e) => {
            const activeDr = document.getElementById('slotwire-quick-edit-drawer') || drawer;
            if (e.key === 'Escape' && activeDr && (activeDr.classList.contains('sw-open') || !activeDr.classList.contains('translate-x-full'))) {
                closeDrawer();
            }
        });
        let isSaving = false;
        const executeQuickSave = async (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (isSaving)
                return;
            const state = window.__slotwire_drawer_state || {};
            const eb = document.getElementById('sw-quick-error') || errorBox;
            const sBtn = document.getElementById('sw-quick-save-btn') || saveBtn;
            const activeForm = document.getElementById('sw-quick-edit-form') || form;
            const resolvedSlot = activeForm?.dataset.slot || sBtn?.dataset.slot || state.slot || currentSlot || '';
            const resolvedCollection = activeForm?.dataset.collection || sBtn?.dataset.collection || state.collection || currentCollection || resolvedSlot;
            const resolvedDocId = activeForm?.dataset.documentId || sBtn?.dataset.documentId || state.documentId || currentDocId || '';
            const targetSlotEl = state.slotElement || currentSlotEl || (resolvedSlot ? document.querySelector(`[data-slotwire-slot="${resolvedSlot}"]`) : null);
            console.log('[SlotWire] Quick Save initiated:', { resolvedSlot, resolvedCollection, resolvedDocId });
            if (!resolvedDocId) {
                const msg = `Cannot publish: No document ID or slug associated with slot '${resolvedSlot}'. Use "Open Full CMS" to edit or link this record.`;
                console.error('[SlotWire] ' + msg);
                if (eb) {
                    eb.textContent = msg;
                    eb.classList.remove('hidden');
                    eb.style.display = 'block';
                }
                return;
            }
            const formData = activeForm ? new FormData(activeForm) : new FormData();
            const patchData = {};
            formData.forEach((val, key) => {
                patchData[key] = val;
            });
            patchData.status = 'published';
            if (sBtn) {
                sBtn.disabled = true;
                sBtn.innerHTML = '<span>🚀 Publishing...</span>';
            }
            if (eb) {
                eb.classList.add('hidden');
                eb.style.display = 'none';
                eb.textContent = '';
            }
            isSaving = true;
            try {
                let token = SlotWireAuthManager.getToken(configuredApiUrl);
                if (!token) {
                    try {
                        const authRes = await SlotWireAuthManager.openAuthPopup(configuredApiUrl, configuredProvider);
                        token = authRes.token;
                        await updateDrawerAuthState();
                    }
                    catch {
                        isSaving = false;
                        if (sBtn) {
                            sBtn.disabled = false;
                            sBtn.innerHTML = '<span>🚀 Publish Changes</span>';
                        }
                        return;
                    }
                }
                const headers = {
                    'Content-Type': 'application/json',
                    'x-slotwire-action': 'quick-save',
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                const res = await fetch('/api/slotwire/quick-save', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        collection: resolvedCollection,
                        documentId: resolvedDocId,
                        publish: true,
                        data: patchData,
                    }),
                });
                if (!res.ok) {
                    if (res.status === 401) {
                        SlotWireAuthManager.clearAuth(configuredApiUrl);
                        await updateDrawerAuthState();
                    }
                    let errMsg = `Publish failed (${res.status})`;
                    try {
                        const json = await res.json();
                        if (json.error)
                            errMsg = json.error;
                        if (json.message)
                            errMsg = `${errMsg}: ${json.message}`;
                    }
                    catch {
                        const text = await res.text();
                        if (text)
                            errMsg = text;
                    }
                    throw new Error(errMsg);
                }
                console.log('[SlotWire] Quick Save succeeded:', { resolvedSlot, resolvedDocId });
                if (sBtn) {
                    sBtn.innerHTML = '<span>✓ Published!</span>';
                    sBtn.classList.add('sw-published');
                }
                // Optimistic DOM Updates
                if (targetSlotEl) {
                    const rawIndex = activeForm?.dataset.itemIndex || state.itemIndex;
                    const itemIndex = rawIndex !== undefined && rawIndex !== '' ? parseInt(String(rawIndex), 10) : undefined;
                    const itemSlug = activeForm?.dataset.itemSlug || state.itemSlug || state.data?.slug || '';
                    const originalTitle = activeForm?.dataset.itemTitle || state.itemTitle || state.data?.title || state.data?.name || '';
                    const originalData = state.data;
                    // Check if this is a composite slot item
                    const popoverBtn = targetSlotEl.querySelector(`.slotwire-popover-quick-btn[data-document-id="${resolvedDocId}"]`);
                    const isCompositeItem = Boolean(popoverBtn || itemIndex !== undefined || targetSlotEl.hasAttribute('data-slotwire-items'));
                    let targetItemEl = targetSlotEl;
                    if (isCompositeItem) {
                        const resolvedCard = resolveChildCardElement(targetSlotEl, resolvedDocId, originalData, itemIndex, itemSlug, originalTitle);
                        if (resolvedCard) {
                            targetItemEl = resolvedCard;
                        }
                        else {
                            targetItemEl = null;
                            console.warn('[SlotWire] Could not resolve specific composite item card for optimistic update:', { resolvedDocId, itemIndex, itemSlug });
                        }
                    }
                    // If this is a composite slot item, update the popover item label and stored data
                    if (popoverBtn) {
                        const popoverItem = popoverBtn.closest('.slotwire-popover-item');
                        const labelEl = popoverItem?.querySelector('.slotwire-popover-item-label');
                        const newLabel = patchData.title || patchData.label || patchData.name || patchData.heading || patchData.authorName;
                        if (labelEl && newLabel) {
                            labelEl.textContent = String(newLabel);
                            labelEl.title = String(newLabel);
                        }
                        if (newLabel) {
                            popoverBtn.setAttribute('data-item-title', String(newLabel));
                        }
                        try {
                            const existingRaw = popoverBtn.getAttribute('data-slot-data');
                            const existingData = existingRaw ? JSON.parse(existingRaw) : {};
                            const merged = { ...existingData, ...patchData };
                            popoverBtn.setAttribute('data-slot-data', JSON.stringify(merged));
                        }
                        catch { }
                    }
                    // Apply optimistic DOM updates if target item/card was resolved
                    if (targetItemEl) {
                        const handledFields = new Set();
                        // 1. Update explicit data-slotwire-field attributes within targetItemEl
                        Object.entries(patchData).forEach(([k, v]) => {
                            const fieldEl = targetItemEl.querySelector(`[data-slotwire-field="${k}"]`) ||
                                (targetItemEl.getAttribute('data-slotwire-field') === k ? targetItemEl : null);
                            if (fieldEl) {
                                handledFields.add(k);
                                if (configuredEditor === 'html' || /<[a-z][\s\S]*>/i.test(String(v))) {
                                    fieldEl.innerHTML = String(v);
                                }
                                else {
                                    fieldEl.textContent = String(v);
                                }
                            }
                        });
                        // 2. Update Heading (Title / Name / Heading / Author)
                        const newHeading = patchData.title || patchData.name || patchData.heading || patchData.authorName;
                        const headingHandled = ['title', 'name', 'heading', 'authorName'].some((f) => handledFields.has(f));
                        if (newHeading && !headingHandled) {
                            const heading = targetItemEl.querySelector('h1, h2, h3, h4, h5, h6') || (targetItemEl.matches('h1, h2, h3, h4, h5, h6') ? targetItemEl : null);
                            if (heading && !heading.closest('.slotwire-in-situ-badge')) {
                                heading.textContent = String(newHeading);
                            }
                        }
                        // 3. Update Body / Paragraph / Description / Content / Quote
                        const bodyVal = patchData.content || patchData.body || patchData.description || patchData.summary || patchData.excerpt || patchData.quoteText || patchData.quote;
                        const bodyHandled = ['content', 'body', 'description', 'summary', 'excerpt', 'quoteText', 'quote'].some((f) => handledFields.has(f));
                        if (bodyVal !== undefined && !bodyHandled) {
                            const p = targetItemEl.querySelector('p, .prose, [class*="description"], [class*="summary"]') || (targetItemEl.matches('p') ? targetItemEl : null);
                            if (p && !p.closest('.slotwire-in-situ-badge')) {
                                if (configuredEditor === 'html' || /<[a-z][\s\S]*>/i.test(String(bodyVal))) {
                                    p.innerHTML = String(bodyVal);
                                }
                                else {
                                    p.textContent = String(bodyVal);
                                }
                            }
                        }
                        // 4. Update Badge Text / Category
                        const badgeVal = patchData.badgeText || patchData.badge;
                        const badgeHandled = ['badgeText', 'badge'].some((f) => handledFields.has(f));
                        if (badgeVal !== undefined && !badgeHandled) {
                            const badgeEl = targetItemEl.querySelector('[class*="badge"], [class*="rounded-full"]');
                            if (badgeEl && !badgeEl.closest('.slotwire-in-situ-badge')) {
                                const textChild = badgeEl.querySelector('span, [class*="label"], [class*="text"]');
                                if (textChild) {
                                    textChild.textContent = String(badgeVal);
                                }
                                else {
                                    const icon = badgeEl.querySelector('svg, img');
                                    if (icon) {
                                        let foundText = false;
                                        for (const node of Array.from(badgeEl.childNodes)) {
                                            if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                                                node.textContent = ` ${badgeVal}`;
                                                foundText = true;
                                                break;
                                            }
                                        }
                                        if (!foundText) {
                                            badgeEl.appendChild(document.createTextNode(` ${badgeVal}`));
                                        }
                                    }
                                    else {
                                        badgeEl.textContent = String(badgeVal);
                                    }
                                }
                            }
                        }
                        // 5. Update Destination URL / Links
                        const newUrl = patchData.destinationUrl || patchData.githubUrl || patchData.url || patchData.href;
                        const urlHandled = ['destinationUrl', 'githubUrl', 'url', 'href'].some((f) => handledFields.has(f));
                        if (newUrl && !urlHandled) {
                            if (targetItemEl.tagName === 'A') {
                                targetItemEl.href = String(newUrl);
                            }
                            else {
                                const a = targetItemEl.querySelector('a[href]');
                                if (a && !a.closest('.slotwire-in-situ-badge')) {
                                    a.href = String(newUrl);
                                }
                            }
                        }
                        // 6. Update Author Role / Subtitle
                        const roleVal = patchData.authorRole || patchData.role || patchData.subtitle;
                        const roleHandled = ['authorRole', 'role', 'subtitle'].some((f) => handledFields.has(f));
                        if (roleVal !== undefined && !roleHandled) {
                            const roleEl = targetItemEl.querySelector('[class*="role"], [class*="subtitle"], a[href*="http"]');
                            if (roleEl && !roleEl.closest('.slotwire-in-situ-badge')) {
                                roleEl.textContent = String(roleVal);
                            }
                        }
                        // 7. Status Badge Tag (for single slots)
                        if (!isCompositeItem) {
                            const statusTag = targetSlotEl.querySelector('.slotwire-status-tag');
                            if (statusTag) {
                                statusTag.textContent = 'Published';
                                statusTag.className = 'slotwire-status-tag sw-status-published';
                            }
                        }
                        // 8. Visual Feedback: subtle emerald pulse highlight on the updated card/element
                        const prevTransition = targetItemEl.style.transition;
                        const prevOutline = targetItemEl.style.outline;
                        const prevShadow = targetItemEl.style.boxShadow;
                        targetItemEl.style.transition = 'all 0.35s ease';
                        targetItemEl.style.outline = '2px solid #10b981';
                        targetItemEl.style.outlineOffset = '2px';
                        targetItemEl.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.4)';
                        setTimeout(() => {
                            if (targetItemEl) {
                                targetItemEl.style.outline = prevOutline;
                                targetItemEl.style.outlineOffset = '';
                                targetItemEl.style.boxShadow = prevShadow;
                                targetItemEl.style.transition = prevTransition;
                            }
                        }, 2400);
                        try {
                            const rect = targetItemEl.getBoundingClientRect();
                            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                            if (!isVisible) {
                                targetItemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        }
                        catch { }
                    }
                }
                // Fire telemetry & update events
                window.dispatchEvent(new CustomEvent('slotwire:recompiled'));
                window.dispatchEvent(new CustomEvent('slotwire:quick-saved', {
                    detail: {
                        slot: resolvedSlot,
                        collection: resolvedCollection,
                        documentId: resolvedDocId,
                        status: 'published',
                        data: patchData,
                    },
                }));
                setTimeout(() => {
                    closeDrawer();
                }, 800);
            }
            catch (err) {
                console.error('[SlotWire] Quick Save error:', err);
                if (eb) {
                    eb.textContent = `Publish Error: ${err.message}`;
                    eb.classList.remove('hidden');
                    eb.style.display = 'block';
                }
                if (sBtn) {
                    sBtn.disabled = false;
                    sBtn.innerHTML = '<span>🚀 Publish Changes</span>';
                }
            }
            finally {
                isSaving = false;
            }
        };
        const activeForm = document.getElementById('sw-quick-edit-form') || form;
        const activeSaveBtn = document.getElementById('sw-quick-save-btn') || saveBtn;
        activeForm?.addEventListener('submit', executeQuickSave);
        activeSaveBtn?.addEventListener('click', executeQuickSave);
    }
    // Global Click Delegate (runs once across whole page lifecycle)
    if (!window.__slotwire_quick_edit_delegate_bound) {
        window.__slotwire_quick_edit_delegate_bound = true;
        document.addEventListener('click', (e) => {
            // 1. Badge "Quick Edit" button
            const btn = e.target.closest('.slotwire-badge-quick-edit-btn, .slotwire-popover-quick-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const slot = btn.getAttribute('data-slot') || '';
                const collection = btn.getAttribute('data-collection') || slot;
                const documentId = btn.getAttribute('data-document-id') || '';
                const editUrl = btn.getAttribute('data-edit-url') || '';
                const rawIndex = btn.getAttribute('data-item-index');
                const itemIndex = rawIndex !== null && rawIndex !== '' ? parseInt(rawIndex, 10) : undefined;
                const itemSlug = btn.getAttribute('data-item-slug') || '';
                const itemTitle = btn.getAttribute('data-item-title') || '';
                let data = null;
                try {
                    const raw = btn.getAttribute('data-slot-data');
                    if (raw)
                        data = JSON.parse(raw);
                }
                catch { }
                const container = btn.closest('.slotwire-slot-container') || document.querySelector(`[data-slotwire-slot="${slot}"]`);
                const openFn = window.__slotwire_open_quick_drawer || openDrawer;
                openFn({ slot, collection, documentId, data, editUrl, slotElement: container, itemIndex, itemSlug, itemTitle });
                return;
            }
            // 2. Inspector "Quick Edit" button
            const inspectorBtn = e.target.closest('.sw-quick-edit-trigger');
            if (inspectorBtn) {
                e.preventDefault();
                e.stopPropagation();
                const slotItem = inspectorBtn.closest('.sw-slot-item');
                const nameEl = slotItem?.querySelector('.sw-slot-name');
                const slotName = (nameEl?.textContent || '').replace(/^#/, '').trim();
                if (slotName) {
                    const container = document.querySelector(`[data-slotwire-slot="${slotName}"]`);
                    // Only click the main badge quick edit button if it exists directly on the badge card (single slots)
                    const badgeBtn = container?.querySelector('.slotwire-badge-card > .slotwire-badge-quick-edit-btn');
                    if (badgeBtn) {
                        badgeBtn.click();
                    }
                    else if (container) {
                        if (container.hasAttribute('data-slotwire-items')) {
                            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }
                        const collection = container.getAttribute('data-slotwire-collection') || slotName;
                        const documentId = container.getAttribute('data-slotwire-id') || '';
                        const editUrl = container.getAttribute('data-slotwire-edit-url') || '';
                        const openFn = window.__slotwire_open_quick_drawer || openDrawer;
                        openFn({ slot: slotName, collection, documentId, data: null, editUrl, slotElement: container });
                    }
                }
                return;
            }
            // 3. Manual Slot Refresh Button (.slotwire-badge-refresh-btn or .sw-slot-refresh-btn)
            const refreshBtn = e.target.closest('.slotwire-badge-refresh-btn, .sw-slot-refresh-btn');
            if (refreshBtn) {
                e.preventDefault();
                e.stopPropagation();
                const slotName = refreshBtn.getAttribute('data-slot') || refreshBtn.getAttribute('data-slot-name');
                if (slotName) {
                    refreshSlot(slotName);
                }
                return;
            }
            // 4. Refresh All Slots Button (#sw-btn-refresh-all)
            const refreshAllBtn = e.target.closest('#sw-btn-refresh-all');
            if (refreshAllBtn) {
                e.preventDefault();
                e.stopPropagation();
                refreshAllSlots();
                return;
            }
        });
        window.addEventListener('slotwire:open-quick-edit', (e) => {
            if (e.detail) {
                const openFn = window.__slotwire_open_quick_drawer || openDrawer;
                openFn(e.detail);
            }
        });
    }
    window.__slotwire_open_quick_drawer = openDrawer;
    window.__slotwire_refresh_slot = refreshSlot;
    window.__slotwire_refresh_all = refreshAllSlots;
    return {
        open: openDrawer,
        close: closeDrawer,
        refreshSlot,
        refreshAllSlots,
    };
}
/**
 * In-Situ Manual Slot Refresh (No Page Reload)
 * Fetches fresh SSR markup from the server and swaps slot content in-place with an emerald pulse.
 */
export async function refreshSlot(slotName) {
    const targetSlotEl = document.querySelector(`.slotwire-slot-container[data-slotwire-slot="${slotName}"]`) ||
        document.querySelector(`[data-slotwire-slot="${slotName}"]`);
    if (!targetSlotEl) {
        console.warn(`[SlotWire] Cannot refresh: slot '${slotName}' not found in DOM`);
        return false;
    }
    const refreshBtns = Array.from(document.querySelectorAll(`.slotwire-badge-refresh-btn[data-slot="${slotName}"], .sw-slot-refresh-btn[data-slot-name="${slotName}"]`));
    refreshBtns.forEach((b) => b.classList.add('sw-spinning'));
    try {
        const refreshUrl = new URL(window.location.href);
        refreshUrl.searchParams.set('_sw_t', Date.now().toString());
        const res = await fetch(refreshUrl.toString(), {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'x-slotwire-refresh': '1',
            },
        });
        if (!res.ok)
            throw new Error(`Server returned HTTP ${res.status}`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const freshSlot = doc.querySelector(`.slotwire-slot-container[data-slotwire-slot="${slotName}"]`) ||
            doc.querySelector(`[data-slotwire-slot="${slotName}"]`);
        if (!freshSlot) {
            throw new Error(`Slot '${slotName}' missing from server response`);
        }
        const isSystemEl = (el) => el.matches('.slotwire-in-situ-badge, .slotwire-inspector-modal, .slotwire-assist-container, aside#slotwire-quick-edit-drawer, [id*="slotwire-quick"]');
        const oldContentNodes = Array.from(targetSlotEl.children).filter((c) => !isSystemEl(c));
        const freshContentNodes = Array.from(freshSlot.children).filter((c) => !isSystemEl(c));
        if (freshContentNodes.length > 0) {
            if (oldContentNodes.length > 0) {
                const adoptedFresh = document.importNode(freshContentNodes[0], true);
                oldContentNodes[0].replaceWith(adoptedFresh);
                for (let i = 1; i < oldContentNodes.length; i++) {
                    oldContentNodes[i].remove();
                }
            }
            else {
                const adoptedFresh = document.importNode(freshContentNodes[0], true);
                targetSlotEl.appendChild(adoptedFresh);
            }
            // Update container attributes if present
            if (freshSlot.hasAttribute('data-slotwire-items')) {
                targetSlotEl.setAttribute('data-slotwire-items', freshSlot.getAttribute('data-slotwire-items') || '');
            }
            if (freshSlot.hasAttribute('data-slotwire-status')) {
                targetSlotEl.setAttribute('data-slotwire-status', freshSlot.getAttribute('data-slotwire-status') || '');
            }
            // Reconcile and update in-situ badge if present so composite item lists & counts update
            const oldBadge = targetSlotEl.querySelector('.slotwire-in-situ-badge');
            const freshBadge = freshSlot.querySelector('.slotwire-in-situ-badge');
            if (oldBadge && freshBadge) {
                oldBadge.replaceWith(document.importNode(freshBadge, true));
            }
            // ── CRITICAL: Re-activate and reveal elements with scroll-reveal animations (mos, aos, sal) ──
            const revealSelectors = '[data-mos], [data-aos], [data-sal], .fade-in, .animate-on-scroll';
            targetSlotEl.querySelectorAll(revealSelectors).forEach((el) => {
                el.classList.add('mos-animate', 'aos-animate', 'sal-animate');
                el.style.opacity = '1';
                el.style.transform = 'none';
                el.style.visibility = 'visible';
            });
            if (targetSlotEl.matches(revealSelectors)) {
                targetSlotEl.classList.add('mos-animate', 'aos-animate', 'sal-animate');
                targetSlotEl.style.opacity = '1';
                targetSlotEl.style.transform = 'none';
                targetSlotEl.style.visibility = 'visible';
            }
            // Dispatch standard Astro lifecycle events so any page-level scripts and observers re-bind
            window.dispatchEvent(new CustomEvent('astro:page-load'));
            window.dispatchEvent(new CustomEvent('astro:after-swap'));
            // Visual pulse feedback
            targetSlotEl.style.transition = 'outline 0.25s ease, box-shadow 0.25s ease';
            targetSlotEl.style.outline = '2px solid #10b981';
            targetSlotEl.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.45)';
            setTimeout(() => {
                targetSlotEl.style.outline = '';
                targetSlotEl.style.boxShadow = '';
            }, 1600);
            console.log(`[SlotWire] Slot '${slotName}' refreshed from CMS in-situ.`);
            window.dispatchEvent(new CustomEvent('slotwire:slot-refreshed', { detail: { slot: slotName } }));
            return true;
        }
    }
    catch (err) {
        console.error(`[SlotWire] Failed to refresh slot '${slotName}':`, err);
    }
    finally {
        refreshBtns.forEach((b) => b.classList.remove('sw-spinning'));
    }
    return false;
}
/**
 * In-Situ Refresh for All Slots on the Page
 */
export async function refreshAllSlots() {
    const slots = Array.from(document.querySelectorAll('.slotwire-slot-container[data-slotwire-slot], [data-slotwire-slot]'));
    if (slots.length === 0)
        return;
    const refreshAllBtn = document.getElementById('sw-btn-refresh-all');
    if (refreshAllBtn)
        refreshAllBtn.classList.add('sw-spinning');
    try {
        const refreshUrl = new URL(window.location.href);
        refreshUrl.searchParams.set('_sw_t', Date.now().toString());
        const res = await fetch(refreshUrl.toString(), {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'x-slotwire-refresh': '1',
            },
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const isSystemEl = (el) => el.matches('.slotwire-in-situ-badge, .slotwire-inspector-modal, .slotwire-assist-container, aside#slotwire-quick-edit-drawer, [id*="slotwire-quick"]');
        const processedSlots = new Set();
        for (const slotEl of slots) {
            const slotName = slotEl.getAttribute('data-slotwire-slot');
            if (!slotName || processedSlots.has(slotName))
                continue;
            processedSlots.add(slotName);
            const freshSlot = doc.querySelector(`.slotwire-slot-container[data-slotwire-slot="${slotName}"]`) ||
                doc.querySelector(`[data-slotwire-slot="${slotName}"]`);
            if (freshSlot) {
                const oldContent = Array.from(slotEl.children).find((c) => !isSystemEl(c));
                const freshContent = Array.from(freshSlot.children).find((c) => !isSystemEl(c));
                if (oldContent && freshContent) {
                    oldContent.replaceWith(document.importNode(freshContent, true));
                }
                if (freshSlot.hasAttribute('data-slotwire-items')) {
                    slotEl.setAttribute('data-slotwire-items', freshSlot.getAttribute('data-slotwire-items') || '');
                }
                if (freshSlot.hasAttribute('data-slotwire-status')) {
                    slotEl.setAttribute('data-slotwire-status', freshSlot.getAttribute('data-slotwire-status') || '');
                }
                const oldBadge = slotEl.querySelector('.slotwire-in-situ-badge');
                const freshBadge = freshSlot.querySelector('.slotwire-in-situ-badge');
                if (oldBadge && freshBadge) {
                    oldBadge.replaceWith(document.importNode(freshBadge, true));
                }
                const revealSelectors = '[data-mos], [data-aos], [data-sal], .fade-in, .animate-on-scroll';
                slotEl.querySelectorAll(revealSelectors).forEach((el) => {
                    el.classList.add('mos-animate', 'aos-animate', 'sal-animate');
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                    el.style.visibility = 'visible';
                });
            }
        }
        window.dispatchEvent(new CustomEvent('astro:page-load'));
        window.dispatchEvent(new CustomEvent('astro:after-swap'));
        console.log(`[SlotWire] All ${processedSlots.size} slots refreshed in-situ.`);
        window.dispatchEvent(new CustomEvent('slotwire:all-refreshed'));
    }
    catch (err) {
        console.error('[SlotWire] Failed to refresh all slots:', err);
    }
    finally {
        if (refreshAllBtn)
            refreshAllBtn.classList.remove('sw-spinning');
    }
}
/**
 * Live Slot Morphing helper using document.startViewTransition
 */
export async function morphSlotElement(slotKey, newHtml) {
    const target = document.querySelector(`[data-slotwire-slot="${slotKey}"]`);
    if (!target)
        return false;
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            target.outerHTML = newHtml;
        });
    }
    else {
        target.outerHTML = newHtml;
    }
    window.dispatchEvent(new CustomEvent('slotwire:recompiled'));
    return true;
}
//# sourceMappingURL=client.js.map