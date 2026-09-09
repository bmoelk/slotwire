import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handleRevalidateRequest } from '../dist/endpoints/revalidate.js';
import { defineContract, s } from '@slotwire/core';

const TEST_SECRET = 'super-secret-webhook-key-12345';

const mockConfig = defineContract({
  cms: {
    provider: 'wordpress',
    apiUrl: 'https://cms.test',
  },
  sync: {
    webhookSecret: TEST_SECRET,
  },
  slots: {
    hero: s.section({ key: 'hero' }),
  },
});

test('handleRevalidateRequest: rejects non-POST with 405', async () => {
  const req = new Request('https://astro.test/api/slotwire/revalidate', { method: 'GET' });
  const res = await handleRevalidateRequest(req, { config: mockConfig });
  assert.equal(res.status, 405);
});

test('handleRevalidateRequest: returns 500 when secret is missing', async () => {
  const emptyConfig = defineContract({
    cms: { provider: 'wordpress', apiUrl: 'https://cms.test' },
    slots: {},
  });
  const req = new Request('https://astro.test/api/slotwire/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: 'hello-world' }),
  });
  const res = await handleRevalidateRequest(req, { config: emptyConfig });
  assert.equal(res.status, 500);
  const json = await res.json();
  assert.match(json.error, /secret not configured/i);
});

test('handleRevalidateRequest: rejects invalid or missing signature with 403', async () => {
  const req = new Request('https://astro.test/api/slotwire/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slotwire-signature': 'sha256=bad-signature-hex',
    },
    body: JSON.stringify({ slug: 'hello-world' }),
  });
  const res = await handleRevalidateRequest(req, { config: mockConfig });
  assert.equal(res.status, 403);
});

test('handleRevalidateRequest: accepts valid HMAC-SHA256 signature', async () => {
  const payload = JSON.stringify({
    event: 'post_updated',
    post_type: 'projects',
    slug: 'solar-initiative',
  });
  const signature = createHmac('sha256', TEST_SECRET).update(payload).digest('hex');

  const req = new Request('https://astro.test/api/slotwire/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slotwire-signature': `sha256=${signature}`,
    },
    body: payload,
  });

  const res = await handleRevalidateRequest(req, { config: mockConfig });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, 'ok');
  assert.equal(json.revalidated, true);
  assert.equal(json.slug, 'solar-initiative');
  assert.equal(json.post_type, 'projects');
  assert.deepEqual(json.paths, ['/projects/solar-initiative']);
});

test('handleRevalidateRequest: accepts direct token via x-slotwire-secret header', async () => {
  const payload = JSON.stringify({
    event: 'post_updated',
    post_type: 'page',
    slug: 'about',
  });

  const req = new Request('https://astro.test/api/slotwire/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slotwire-secret': TEST_SECRET,
    },
    body: payload,
  });

  const res = await handleRevalidateRequest(req, { config: mockConfig });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.revalidated, true);
  assert.ok(json.paths.includes('/about'));
});

test('handleRevalidateRequest: accepts Bearer authorization header', async () => {
  const payload = JSON.stringify({
    event: 'post_updated',
    slug: 'contact',
  });

  const req = new Request('https://astro.test/api/slotwire/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_SECRET}`,
    },
    body: payload,
  });

  const res = await handleRevalidateRequest(req, { config: mockConfig });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.revalidated, true);
});

test('handleRevalidateRequest: triggers onRevalidate callback with payload', async () => {
  let callbackInvoked = false;
  let receivedPayload = null;

  const payload = JSON.stringify({
    event: 'post_deleted',
    post_type: 'post',
    slug: 'legacy-post',
  });
  const signature = createHmac('sha256', TEST_SECRET).update(payload).digest('hex');

  const req = new Request('https://astro.test/api/slotwire/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-slotwire-signature': signature,
    },
    body: payload,
  });

  const res = await handleRevalidateRequest(req, {
    config: mockConfig,
    onRevalidate: async (p) => {
      callbackInvoked = true;
      receivedPayload = p;
    },
  });

  assert.equal(res.status, 200);
  assert.equal(callbackInvoked, true);
  assert.equal(receivedPayload.slug, 'legacy-post');
  assert.equal(receivedPayload.event, 'post_deleted');
});
