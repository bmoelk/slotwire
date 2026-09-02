import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSlotWireAuthGuard } from '../dist/auth-guard.js';
import { signPreviewToken } from '@slotwire/core';

test('authGuard: validates HMAC tokens and sets preview session cookie', async () => {
  const secret = 'preview-secret-key-xyz';
  const config = {
    cms: {
      provider: 'sonicjs',
      apiUrl: 'https://cms.example.com',
      previewSecret: secret,
    },
    slots: {},
  };

  const guard = createSlotWireAuthGuard({ config });

  const token = await signPreviewToken(secret, {
    collection: 'pages',
    slug: 'about',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  });

  const cookiesSet = new Map();
  const mockContext = {
    request: new Request(`https://example.com/api/preview?token=${token}`),
    url: new URL(`https://example.com/api/preview?token=${token}`),
    cookies: {
      set: (name, val) => cookiesSet.set(name, val),
    },
  };

  let nextCalled = false;
  const res = await guard(mockContext, async () => {
    nextCalled = true;
    return new Response('OK', { status: 200 });
  });

  assert.equal(nextCalled, true);
  assert.equal(cookiesSet.get('slotwire_preview'), 'true');
});

test('authGuard: enforces CSRF action header on POST mutation endpoints', async () => {
  const config = {
    cms: {
      provider: 'sonicjs',
      apiUrl: 'https://cms.example.com',
      previewSecret: 'secret',
    },
    slots: {},
  };

  const guard = createSlotWireAuthGuard({ config });

  // Missing header
  const reqNoHeader = new Request('https://example.com/api/slotwire/scaffold', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const contextNoHeader = {
    request: reqNoHeader,
    url: new URL('https://example.com/api/slotwire/scaffold'),
    cookies: { set: () => {} },
  };

  const resForbidden = await guard(contextNoHeader, async () => new Response('OK'));
  assert.equal(resForbidden.status, 403);

  // With valid header
  const reqWithHeader = new Request('https://example.com/api/slotwire/scaffold', {
    method: 'POST',
    headers: { 'x-slotwire-action': 'scaffold' },
    body: JSON.stringify({}),
  });
  const contextWithHeader = {
    request: reqWithHeader,
    url: new URL('https://example.com/api/slotwire/scaffold'),
    cookies: { set: () => {} },
  };

  const resOk = await guard(contextWithHeader, async () => new Response('OK'));
  assert.equal(resOk.status, 200);
});
