import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signPreviewToken, verifyPreviewToken } from '../dist/auth.js';

test('auth: signs and verifies HMAC-SHA256 preview tokens', async () => {
  const secret = 'super-secret-key-123';
  const payload = {
    collection: 'pages',
    slug: 'technology',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour future
    iat: Math.floor(Date.now() / 1000),
    role: 'editor',
  };

  const token = await signPreviewToken(secret, payload);
  assert.ok(token);
  assert.equal(token.split('.').length, 3);

  // Successful verification
  const result = await verifyPreviewToken(secret, token);
  assert.equal(result.valid, true);
  assert.equal(result.payload?.slug, 'technology');
  assert.equal(result.payload?.role, 'editor');

  // Invalid secret failure
  const badSecretResult = await verifyPreviewToken('wrong-secret-key', token);
  assert.equal(badSecretResult.valid, false);
  assert.equal(badSecretResult.error, 'Invalid token signature');

  // Expired token failure
  const expiredPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) - 100, // in the past
  };
  const expiredToken = await signPreviewToken(secret, expiredPayload);
  const expiredResult = await verifyPreviewToken(secret, expiredToken);
  assert.equal(expiredResult.valid, false);
  assert.equal(expiredResult.error, 'Token expired');
});
