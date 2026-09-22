/**
 * Universal Slot Highlighting Controller for SlotWire
 * Provides keyboard shortcuts (Alt+S), persistent highlight states, and visual outline overlays.
 * Elevated z-index (z: 25) ensures outlines render cleanly over section dividers (z: 10).
 */

const STORAGE_KEY = 'slotwire_highlight_slots';
const CLASS_NAME = 'slotwire-highlight-slots';

// Determine if current session is development, staging, or preview mode
export function isDevOrPreview(): boolean {
  if (typeof window === 'undefined') return false;

  // Vite / Astro dev mode
  if (Boolean((import.meta as any).env?.DEV)) return true;

  const host = window.location.hostname;
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.local') ||
    host.includes('staging') ||
    host.startsWith('edit.')
  ) {
    return true;
  }

  const params = new URLSearchParams(window.location.search);
  if (
    params.get('slotwire_preview') === 'true' ||
    params.get('slotwire_assist') === 'true' ||
    params.get('slotwire_highlight') === 'true' ||
    params.get('slots') === 'true'
  ) {
    return true;
  }

  if (typeof document !== 'undefined' && document.cookie && document.cookie.includes('slotwire_preview=true')) {
    return true;
  }

  return false;
}

// 1. Determine Initial Highlight State
export function getInitialHighlightState(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('slotwire_highlight') === 'true' || params.get('slots') === 'true') {
    return true;
  }
  if (params.get('slotwire_highlight') === 'false' || params.get('slots') === 'false') {
    return false;
  }
  if (isDevOrPreview()) {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  }
  return false;
}

// 2. Dynamic Badge Overlays for purely static HTML
export function syncStaticSlotBadges(active: boolean) {
  if (typeof document === 'undefined') return;

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
}

// 3. Apply or Remove Highlighting Globally
export function setSlotHighlight(active: boolean) {
  if (typeof document === 'undefined') return;

  if (active) {
    document.documentElement.classList.add(CLASS_NAME);
    sessionStorage.setItem(STORAGE_KEY, 'true');
  } else {
    document.documentElement.classList.remove(CLASS_NAME);
    sessionStorage.setItem(STORAGE_KEY, 'false');
  }

  syncStaticSlotBadges(active);

  // Broadcast change event for any mounted inspectors or toolbars to synchronize
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('slotwire:highlight-change', { detail: { active } }));
  }
}

// 4. Ensure Global CSS Styles are injected
export function injectHighlightStyles() {
  if (typeof document === 'undefined' || document.getElementById('slotwire-highlight-styles')) return;

  const style = document.createElement('style');
  style.id = 'slotwire-highlight-styles';
  style.textContent = `
    /* High-contrast Emerald Highlight Outlines - Elevated above diagonal dividers (z-10) */
    html.slotwire-highlight-slots .slotwire-slot-container,
    html.slotwire-highlight-slots [data-slotwire-slot],
    html.slotwire-highlight-slots .slotwire-ghost-slot,
    html.slotwire-highlight-slots .slotwire-ghost-card {
      outline: 2px dashed #10b981 !important;
      outline-offset: -2px !important;
      border-radius: 8px !important;
      position: relative !important;
      z-index: 25 !important;
      box-shadow: inset 0 0 0 2px rgba(16, 185, 129, 0.4), 0 0 16px rgba(16, 185, 129, 0.2) !important;
      transition: outline 0.15s ease-in-out !important;
    }

    /* Force reveal in-situ badges */
    html.slotwire-highlight-slots .slotwire-in-situ-badge {
      opacity: 1 !important;
      pointer-events: auto !important;
      transform: translateY(0) !important;
      z-index: 99990 !important;
    }
    html.slotwire-highlight-slots .slotwire-in-situ-badge .slotwire-badge-card {
      pointer-events: auto !important;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.45) !important;
      border-color: #10b981 !important;
    }

    /* Dynamic Badges for Static Tagged Elements */
    .slotwire-static-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 9990;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: #09090b !important;
      border: 1px solid #10b981 !important;
      border-radius: 6px;
      padding: 3px 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 600;
      color: #34d399 !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6), 0 0 12px rgba(16, 185, 129, 0.35);
      pointer-events: none;
    }
    .slotwire-static-badge .sw-badge-arch {
      background-color: rgba(16, 185, 129, 0.18);
      color: #6ee7b7;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 9px;
      text-transform: uppercase;
    }
  `;
  document.head.appendChild(style);
}

// 5. Setup Keyboard Shortcut (Alt + S)
export function setupHighlightKeyboardShortcut() {
  if (typeof window === 'undefined' || (window as any).__slotwire_keyboard_bound) return;
  (window as any).__slotwire_keyboard_bound = true;

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Don't trigger when user is actively typing in a form input
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    // Alt + S or Option + S (Mac) or Ctrl + Shift + S
    if (
      (e.altKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) ||
      (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS'))
    ) {
      e.preventDefault();
      const isCurrentlyActive = document.documentElement.classList.contains(CLASS_NAME);
      setSlotHighlight(!isCurrentlyActive);
    }
  });
}

// Main initializer
export function initSlotHighlight() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // In production (not dev and not preview/staging), SlotWire highlighting must NOT run
  if (!isDevOrPreview()) return;

  injectHighlightStyles();
  setupHighlightKeyboardShortcut();

  const shouldHighlight = getInitialHighlightState();
  setSlotHighlight(shouldHighlight);
}

// Auto-run when imported in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlotHighlight);
  } else {
    initSlotHighlight();
  }
  document.addEventListener('astro:page-load', initSlotHighlight);
  document.addEventListener('astro:after-swap', initSlotHighlight);
}
