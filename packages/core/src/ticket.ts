import type {
  ContentTicket,
  TicketContext,
  TicketSeverity,
  TicketStatus,
  TicketDispatchOptions,
  TicketDispatchResult,
  BookmarkletOptions,
  SlotMetadata,
} from './types.js';

export interface CreateTicketOptions {
  title?: string;
  description: string;
  severity?: TicketSeverity;
  status?: TicketStatus;
  context: TicketContext;
  stagingBaseUrl?: string;
  adminUrl?: string;
  reporterEmail?: string;
}

/**
 * Creates a canonical SlotWire Content Ticket adhering to slotwire-ticket.v1.json.
 */
export function createContentTicket(options: CreateTicketOptions): ContentTicket {
  const {
    description,
    severity = 'medium',
    status = 'open',
    context,
    stagingBaseUrl = 'https://staging.example.com',
    adminUrl = 'https://cms.brainendeavor.com/admin',
    reporterEmail,
  } = options;

  const slotKey = context.slotKey;
  const pageSlug = context.pageSlug || context.route.replace(/^\//, '') || 'home';
  const collection = context.collection || slotKey;
  const sectionKey = context.sectionKey || slotKey;
  const docId = context.documentId;

  const ticketId = `tkt-${pageSlug}-${slotKey}-${Date.now()}`;
  const title = options.title || `[SlotWire Fix]: '${slotKey}' on ${context.route}`;

  const cleanStaging = stagingBaseUrl.replace(/\/+$/, '');
  const cleanAdmin = adminUrl.replace(/\/+$/, '');

  const stagingUrl = `${cleanStaging}${context.route.startsWith('/') ? '' : '/'}${context.route}?slotwire_preview=true#slotwire-highlight=${encodeURIComponent(slotKey)}`;
  const cmsEditUrl = docId
    ? `${cleanAdmin}/content/edit/${encodeURIComponent(docId)}?pageSlug=${encodeURIComponent(pageSlug)}&sectionKey=${encodeURIComponent(sectionKey)}`
    : `${cleanAdmin}/collections/${encodeURIComponent(collection)}/new?pageSlug=${encodeURIComponent(pageSlug)}&sectionKey=${encodeURIComponent(sectionKey)}`;

  return {
    ticketId,
    version: '1.0.0',
    title,
    description,
    status,
    severity,
    context: {
      sourceUrl: context.sourceUrl,
      route: context.route,
      slotKey,
      archetype: context.archetype,
      collection,
      sectionKey,
      documentId: docId,
      pageSlug,
    },
    deepLinks: {
      stagingUrl,
      cmsEditUrl,
    },
    reporter: reporterEmail
      ? {
          email: reporterEmail,
          authenticatedVia: 'internal_session',
        }
      : undefined,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Formats a ContentTicket into clean Markdown suitable for GitHub Issues or Linear tasks.
 */
export function formatTicketMarkdown(ticket: ContentTicket): string {
  return `### ⚡ SlotWire Content Ticket: \`${ticket.context.slotKey}\`

**Issue Title**: ${ticket.title}  
**Severity**: \`${ticket.severity.toUpperCase()}\` • **Status**: \`${ticket.status.toUpperCase()}\`  
**Created**: ${ticket.createdAt}

---

#### 📝 Description & Notes
${ticket.description}

---

#### 📍 Content Context
- **Source Route**: [${ticket.context.route}](${ticket.context.sourceUrl})
- **Slot Key**: \`${ticket.context.slotKey}\`
- **Collection**: \`${ticket.context.collection || 'unmapped'}\`
- **Page Slug**: \`${ticket.context.pageSlug || 'default'}\`
${ticket.context.sectionKey ? `- **Section Key**: \`${ticket.context.sectionKey}\`` : ''}
${ticket.context.documentId ? `- **Document ID**: \`${ticket.context.documentId}\`` : ''}

---

#### 🚀 Action Deep Links
- **Staging Preview**: [Open in Staging Preview & Live Fix](${ticket.deepLinks.stagingUrl})
- **CMS Direct Editor**: [Edit Content in CMS Admin](${ticket.deepLinks.cmsEditUrl})
`;
}

/**
 * Dispatches a ticket concurrently to external webhooks and internal CMS queue.
 * (Not mutually exclusive: both can execute together).
 */
export async function dispatchTicket(
  ticket: ContentTicket,
  options: TicketDispatchOptions
): Promise<TicketDispatchResult> {
  const errors: string[] = [];
  let webhookDispatched = false;
  let internalQueueSaved = false;

  const promises: Promise<void>[] = [];

  // Channel A: External Webhook (Linear, GitHub, Slack, Zapier)
  if (options.webhookUrl) {
    promises.push(
      (async () => {
        try {
          const res = await fetch(options.webhookUrl!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-slotwire-event': 'ticket:created',
            },
            body: JSON.stringify({
              ticket,
              markdown: formatTicketMarkdown(ticket),
            }),
          });
          if (res.ok) {
            webhookDispatched = true;
          } else {
            const txt = await res.text().catch(() => '');
            errors.push(`Webhook returned HTTP ${res.status}: ${txt}`);
          }
        } catch (err: any) {
          errors.push(`Webhook dispatch error: ${err.message}`);
        }
      })()
    );
  }

  // Channel B: Internal CMS Queue
  if (options.internalQueueEndpoint) {
    promises.push(
      (async () => {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-slotwire-action': 'ticket:create',
          };
          if (options.apiKey) {
            headers['Authorization'] = `Bearer ${options.apiKey}`;
          }

          const res = await fetch(options.internalQueueEndpoint!, {
            method: 'POST',
            headers,
            body: JSON.stringify(ticket),
          });
          if (res.ok) {
            internalQueueSaved = true;
          } else {
            const txt = await res.text().catch(() => '');
            errors.push(`Internal queue returned HTTP ${res.status}: ${txt}`);
          }
        } catch (err: any) {
          errors.push(`Internal queue dispatch error: ${err.message}`);
        }
      })()
    );
  }

  await Promise.all(promises);

  return {
    success: errors.length === 0,
    ticketId: ticket.ticketId,
    webhookDispatched,
    internalQueueSaved,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Generates the executable javascript:... bookmarklet code string for editors.
 */
export function generateBookmarkletCode(options: BookmarkletOptions = {}): string {
  const {
    adminUrl = 'https://cms.brainendeavor.com/admin',
    stagingUrl = 'https://staging.example.com',
  } = options;

  const script = `
(function(){
  if(window.__SLOTWIRE_INSPECTOR_ACTIVE__){
    window.__SLOTWIRE_INSPECTOR_ACTIVE__();
    return;
  }
  const slots = document.querySelectorAll('[data-slotwire-slot]');
  if(slots.length === 0){
    alert('⚡ SlotWire Inspector: No data-slotwire-* elements found on this page.');
    return;
  }
  let activeBox = null;
  const overlay = document.createElement('div');
  overlay.id = 'slotwire-bookmarklet-overlay';
  overlay.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:999999;background:#090d16;color:#f8fafc;padding:12px 16px;border-radius:12px;border:1px solid #10b981;box-shadow:0 20px 40px rgba(0,0,0,0.8);font-family:monospace;font-size:12px;';
  overlay.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;"><span style="color:#10b981;font-weight:bold;">⚡ SlotWire Inspector Active (' + slots.length + ' slots)</span><button id="sw-b-close" style="background:#27272a;color:#fff;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;">✕</button></div><p style="margin-top:6px;color:#94a3b8;font-size:11px;">Click any highlighted section to create a Content Ticket.</p>';
  document.body.appendChild(overlay);

  function cleanup(){
    slots.forEach(el => el.style.outline = '');
    overlay.remove();
    window.__SLOTWIRE_INSPECTOR_ACTIVE__ = null;
  }
  document.getElementById('sw-b-close').onclick = cleanup;
  window.__SLOTWIRE_INSPECTOR_ACTIVE__ = cleanup;

  slots.forEach(el => {
    el.style.outline = '2px dashed #10b981';
    el.style.cursor = 'crosshair';
    el.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();
      const slot = el.getAttribute('data-slotwire-slot');
      const collection = el.getAttribute('data-slotwire-collection') || slot;
      const page = el.getAttribute('data-slotwire-page') || location.pathname;
      const id = el.getAttribute('data-slotwire-id') || '';
      const notes = prompt('⚡ Flag Content Issue for slot [' + slot + ']:\\nEnter issue description:');
      if(!notes) return;
      const stagingBase = '${stagingUrl.replace(/\/+$/, '')}';
      const adminBase = '${adminUrl.replace(/\/+$/, '')}';
      const stagingLink = stagingBase + location.pathname + '?slotwire_preview=true#slotwire-highlight=' + encodeURIComponent(slot);
      const cmsLink = id ? adminBase + '/content/edit/' + encodeURIComponent(id) : adminBase + '/collections/' + encodeURIComponent(collection) + '/new?pageSlug=' + encodeURIComponent(page);
      const markdown = '### [SlotWire Fix]: ' + slot + '\\n- **Route**: ' + location.href + '\\n- **Slot**: ' + slot + '\\n- **Collection**: ' + collection + '\\n- **Description**: ' + notes + '\\n- **Staging Preview**: ' + stagingLink + '\\n- **CMS Link**: ' + cmsLink;
      navigator.clipboard.writeText(markdown).then(() => {
        alert('✔ Fix Ticket copied to clipboard (GitHub/Linear Markdown)!\\n\\nStaging Link: ' + stagingLink);
      });
    };
  });
})();
`.trim().replace(/\n\s*/g, ' ');

  return `javascript:${encodeURIComponent(script)}`;
}
