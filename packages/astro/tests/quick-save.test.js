import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleQuickSaveRequest } from '../dist/endpoints/quick-save.js';
import { defineContract, s, registerCmsAdapter, BaseCmsAdapter } from '@slotwire/core';

class QuickSaveTestAdapter extends BaseCmsAdapter {
  provider = 'quick-save-test';

  buildAdminLink() {
    return 'https://cms.test/admin';
  }

  async updateItem(collection, documentId, data, credentials) {
    if (documentId === 'fail-id') {
      return {
        success: false,
        error: 'Database lock timeout',
      };
    }
    return {
      success: true,
      collection,
      documentId,
      data: {
        id: documentId,
        ...data,
        updated_at: '2026-09-08T12:00:00Z',
      },
    };
  }
}

class UnsupportedAdapter extends BaseCmsAdapter {
  provider = 'unsupported-test';

  buildAdminLink() {
    return 'https://cms.test/admin';
  }

  updateItem = undefined;
}

registerCmsAdapter(new QuickSaveTestAdapter());
registerCmsAdapter(new UnsupportedAdapter());

const mockConfig = defineContract({
  cms: {
    provider: 'quick-save-test',
    apiUrl: 'https://cms.test',
  },
  slots: {
    hero: s.section({
      key: 'hero',
      defaultTitle: 'Starter Hero',
    }),
  },
});

test('handleQuickSaveRequest: rejects non-POST with 405', async () => {
  const req = new Request('https://astro.test/api/slotwire/quick-save', { method: 'GET' });
  const res = await handleQuickSaveRequest(req, { config: mockConfig });
  assert.equal(res.status, 405);
});

test('handleQuickSaveRequest: rejects missing or invalid x-slotwire-action header with 403', async () => {
  const req = new Request('https://astro.test/api/slotwire/quick-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection: 'pages', documentId: 'p1', data: { title: 'New' } }),
  });
  const res = await handleQuickSaveRequest(req, { config: mockConfig });
  assert.equal(res.status, 403);
});

test('handleQuickSaveRequest: rejects missing collection or documentId with 400', async () => {
  const req = new Request('https://astro.test/api/slotwire/quick-save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slotwire-action': 'quick-save',
    },
    body: JSON.stringify({ collection: 'pages', data: { title: 'New' } }),
  });
  const res = await handleQuickSaveRequest(req, { config: mockConfig });
  assert.equal(res.status, 400);
});

test('handleQuickSaveRequest: rejects missing data payload with 400', async () => {
  const req = new Request('https://astro.test/api/slotwire/quick-save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slotwire-action': 'quick-save',
    },
    body: JSON.stringify({ collection: 'pages', documentId: 'p1' }),
  });
  const res = await handleQuickSaveRequest(req, { config: mockConfig });
  assert.equal(res.status, 400);
});

test('handleQuickSaveRequest: dispatches updateItem and returns 200 with updated payload', async () => {
  const req = new Request('https://astro.test/api/slotwire/quick-save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slotwire-action': 'quick-save',
    },
    body: JSON.stringify({
      collection: 'homepage_sections',
      documentId: 'sec-123',
      data: {
        title: 'Updated Headline',
        content: 'Brand new body copy in markdown',
      },
    }),
  });
  const res = await handleQuickSaveRequest(req, { config: mockConfig });
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.status, 'ok');
  assert.equal(json.collection, 'homepage_sections');
  assert.equal(json.documentId, 'sec-123');
  assert.equal(json.data.title, 'Updated Headline');
  assert.equal(json.data.content, 'Brand new body copy in markdown');
});

test('handleQuickSaveRequest: returns 500 when adapter returns error', async () => {
  const req = new Request('https://astro.test/api/slotwire/quick-save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slotwire-action': 'quick-save',
    },
    body: JSON.stringify({
      collection: 'pages',
      documentId: 'fail-id',
      data: { title: 'Fail Test' },
    }),
  });
  const res = await handleQuickSaveRequest(req, { config: mockConfig });
  assert.equal(res.status, 500);

  const json = await res.json();
  assert.ok(json.error.includes('Database lock timeout'));
});

test('handleQuickSaveRequest: returns 501 when adapter does not implement updateItem', async () => {
  const unsuppConfig = defineContract({
    cms: {
      provider: 'unsupported-test',
      apiUrl: 'https://cms.test',
    },
    slots: {},
  });

  const req = new Request('https://astro.test/api/slotwire/quick-save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slotwire-action': 'quick-save',
    },
    body: JSON.stringify({
      collection: 'pages',
      documentId: 'doc-1',
      data: { title: 'No updateItem' },
    }),
  });
  const res = await handleQuickSaveRequest(req, { config: unsuppConfig });
  assert.equal(res.status, 501);
});
