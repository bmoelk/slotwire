import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleScaffoldRequest } from '../dist/endpoints/scaffold.js';
import { defineContract, s, registerCmsAdapter, BaseCmsAdapter } from '@slotwire/core';

const mockConfig = defineContract({
  cms: {
    provider: 'scaffold-cms-test',
    apiUrl: 'https://cms.test',
  },
  archetypes: {
    service: s.page({
      template: 'service',
      description: 'Service Detail Page',
      slots: {
        hero: s.section({
          key: 'hero',
          defaultTitle: 'Starter Service Hero',
        }),
      },
    }),
  },
  slots: {
    pages: s.collection('pages', {
      title: s.string(),
      slug: s.slug(),
    }),
  },
});

class ScaffoldTestAdapter extends BaseCmsAdapter {
  provider = 'scaffold-cms-test';

  buildAdminLink() {
    return 'https://cms.test/admin';
  }

  async scaffoldBundle(bundle, credentials) {
    if (bundle.slug === 'fail-slug') {
      return {
        success: false,
        status: 'error',
        targetSlug: bundle.slug,
        createdCount: 0,
        createdIds: [],
        errors: ['Database constraint violated'],
      };
    }
    return {
      success: true,
      status: 'ok',
      targetSlug: bundle.slug,
      createdCount: bundle.records.length,
      createdIds: bundle.records.map((r) => r.data.slug || 'rec-id'),
      targetUrl: `/${bundle.slug}?slotwire_preview=true`,
      previewUrl: `/${bundle.slug}?slotwire_preview=true`,
    };
  }
}

registerCmsAdapter(new ScaffoldTestAdapter());

test('handleScaffoldRequest: rejects non-POST requests with 405', async () => {
  const req = new Request('https://astro.test/api/slotwire/scaffold', { method: 'GET' });
  const res = await handleScaffoldRequest(req, { config: mockConfig });
  assert.equal(res.status, 405);
});

test('handleScaffoldRequest: returns 400 if targetSlug is missing', async () => {
  const req = new Request('https://astro.test/api/slotwire/scaffold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetTitle: 'Missing Slug' }),
  });
  const res = await handleScaffoldRequest(req, { config: mockConfig });
  assert.equal(res.status, 400);
});

test('handleScaffoldRequest: scaffolds bundle and returns preview url', async () => {
  const req = new Request('https://astro.test/api/slotwire/scaffold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetSlug: 'cloud-consulting',
      targetTitle: 'Cloud Consulting',
      template: 'service',
      addToNav: true,
    }),
  });
  const res = await handleScaffoldRequest(req, { config: mockConfig });
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.status, 'ok');
  assert.equal(json.slug, 'cloud-consulting');
  assert.equal(json.targetUrl, '/cloud-consulting?slotwire_preview=true');
  assert.ok(json.createdCount >= 1);
});

test('handleScaffoldRequest: returns 500 when adapter scaffoldBundle fails', async () => {
  const req = new Request('https://astro.test/api/slotwire/scaffold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetSlug: 'fail-slug',
      targetTitle: 'Should Fail',
      template: 'service',
    }),
  });
  const res = await handleScaffoldRequest(req, { config: mockConfig });
  assert.equal(res.status, 500);

  const json = await res.json();
  assert.ok(json.error.includes('Database constraint violated'));
});
