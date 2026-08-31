import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createContentTicket,
  formatTicketMarkdown,
  dispatchTicket,
  generateBookmarkletCode,
} from '../dist/ticket.js';

test('ticket: creates canonical ContentTicket and formats markdown', () => {
  const ticket = createContentTicket({
    title: 'Update AI Vector Card Copy',
    description: 'The latency numbers should be updated from 5ms to 2ms.',
    severity: 'medium',
    context: {
      sourceUrl: 'https://brainendeavor.com/services/ai',
      route: '/services/ai',
      slotKey: 'feature_cards',
      archetype: 'cards',
      collection: 'feature_cards',
      sectionKey: 'stack',
      documentId: 'doc-stack-1',
      pageSlug: 'ai',
    },
    stagingBaseUrl: 'https://staging.brainendeavor.com',
    adminUrl: 'https://cms.brainendeavor.com/admin',
    reporterEmail: 'brian@brainendeavor.com',
  });

  assert.ok(ticket.ticketId.startsWith('tkt-ai-feature_cards-'));
  assert.equal(ticket.version, '1.0.0');
  assert.equal(ticket.status, 'open');
  assert.equal(ticket.context.slotKey, 'feature_cards');
  assert.equal(
    ticket.deepLinks.stagingUrl,
    'https://staging.brainendeavor.com/services/ai?slotwire_preview=true#slotwire-highlight=feature_cards'
  );
  assert.equal(
    ticket.deepLinks.cmsEditUrl,
    'https://cms.brainendeavor.com/admin/content/doc-stack-1/edit?pageSlug=ai&sectionKey=stack'
  );

  const markdown = formatTicketMarkdown(ticket);
  assert.ok(markdown.includes('SlotWire Content Ticket: `feature_cards`'));
  assert.ok(markdown.includes('https://staging.brainendeavor.com/services/ai?slotwire_preview=true#slotwire-highlight=feature_cards'));
});

test('ticket: generates executable bookmarklet code string', () => {
  const bookmarklet = generateBookmarkletCode({
    stagingUrl: 'https://staging.example.com',
    adminUrl: 'https://cms.example.com/admin',
  });

  assert.ok(bookmarklet.startsWith('javascript:'));
  assert.ok(bookmarklet.includes('data-slotwire-slot'));
  assert.ok(bookmarklet.includes('slotwire-highlight'));
});

test('ticket: dispatches to external webhook and internal queue concurrently', async () => {
  let webhookPayload = null;
  let queuePayload = null;

  // Mock global fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes('linear.app')) {
      webhookPayload = JSON.parse(opts.body);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (String(url).includes('/api/slotwire/tickets')) {
      queuePayload = JSON.parse(opts.body);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return originalFetch(url, opts);
  };

  try {
    const ticket = createContentTicket({
      description: 'Concurrent dispatch test',
      context: {
        sourceUrl: 'https://example.com/pricing',
        route: '/pricing',
        slotKey: 'pricing_faq',
      },
    });

    const result = await dispatchTicket(ticket, {
      webhookUrl: 'https://api.linear.app/v1/webhooks/slotwire',
      internalQueueEndpoint: 'https://cms.example.com/api/slotwire/tickets',
    });

    assert.equal(result.success, true);
    assert.equal(result.webhookDispatched, true);
    assert.equal(result.internalQueueSaved, true);
    assert.ok(webhookPayload);
    assert.ok(queuePayload);
    assert.equal(queuePayload.context.slotKey, 'pricing_faq');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
