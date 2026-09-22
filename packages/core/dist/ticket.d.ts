import type { ContentTicket, TicketContext, TicketSeverity, TicketStatus, TicketDispatchOptions, TicketDispatchResult, BookmarkletOptions } from './types.js';
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
export declare function createContentTicket(options: CreateTicketOptions): ContentTicket;
/**
 * Formats a ContentTicket into clean Markdown suitable for GitHub Issues or Linear tasks.
 */
export declare function formatTicketMarkdown(ticket: ContentTicket): string;
/**
 * Dispatches a ticket concurrently to external webhooks and internal CMS queue.
 * (Not mutually exclusive: both can execute together).
 */
export declare function dispatchTicket(ticket: ContentTicket, options: TicketDispatchOptions): Promise<TicketDispatchResult>;
/**
 * Generates the executable javascript:... bookmarklet code string for editors.
 */
export declare function generateBookmarkletCode(options?: BookmarkletOptions): string;
//# sourceMappingURL=ticket.d.ts.map