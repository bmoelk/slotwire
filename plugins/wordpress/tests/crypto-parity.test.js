import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyPreviewToken, signPreviewToken } from '@slotwire/core';

const TEST_SECRET = 'wp-astro-shared-preview-secret-key-999';

/**
 * Replicates PHP base64url_encode($data)
 */
function phpBase64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Replicates PHP generate_preview_token() implementation in class-slotwire-preview.php
 */
function phpGeneratePreviewToken(post, secret, ttl = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(post.ID),
    slug: post.post_name,
    post_type: post.post_type,
    iat: now,
    exp: now + ttl,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = phpBase64UrlEncode(JSON.stringify(header));
  const payloadB64 = phpBase64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const rawSig = createHmac('sha256', secret).update(dataToSign).digest();
  const sigB64 = rawSig
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${dataToSign}.${sigB64}`;
}

test('WordPress Crypto Parity: token generated with PHP algorithm verifies in @slotwire/core', async () => {
  const mockPost = {
    ID: 42,
    post_name: 'introducing-slotwire',
    post_type: 'post',
  };

  const phpToken = phpGeneratePreviewToken(mockPost, TEST_SECRET, 3600);
  assert.ok(phpToken, 'Token was generated');
  assert.equal(phpToken.split('.').length, 3, 'Token is a 3-part JWT');

  const result = await verifyPreviewToken(TEST_SECRET, phpToken);
  assert.equal(result.valid, true, 'Verification succeeded');
  assert.equal(result.payload?.sub, '42');
  assert.equal(result.payload?.slug, 'introducing-slotwire');
  assert.equal(result.payload?.post_type, 'post');
});

test('WordPress Crypto Parity: rejects token signed with mismatched secret', async () => {
  const mockPost = { ID: 101, post_name: 'secret-post', post_type: 'page' };
  const phpToken = phpGeneratePreviewToken(mockPost, 'wrong-secret-key');

  const result = await verifyPreviewToken(TEST_SECRET, phpToken);
  assert.equal(result.valid, false);
  assert.match(result.error, /signature/i);
});

test('WordPress Crypto Parity: rejects expired token', async () => {
  const mockPost = { ID: 55, post_name: 'old-draft', post_type: 'post' };
  // Expired 60 seconds ago
  const expiredToken = phpGeneratePreviewToken(mockPost, TEST_SECRET, -60);

  const result = await verifyPreviewToken(TEST_SECRET, expiredToken);
  assert.equal(result.valid, false);
  assert.match(result.error, /expired/i);
});

test('WordPress Crypto Parity: @slotwire/core token has identical structure', async () => {
  const coreToken = await signPreviewToken(TEST_SECRET, {
    sub: '10',
    slug: 'about-us',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const verified = await verifyPreviewToken(TEST_SECRET, coreToken);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload?.slug, 'about-us');
});
