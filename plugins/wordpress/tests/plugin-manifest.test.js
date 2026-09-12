import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginRoot = resolve(__dirname, '..');

test('WordPress Manifest: slotwire-headless.php header compliance', () => {
  const mainFile = resolve(pluginRoot, 'slotwire-headless.php');
  assert.ok(existsSync(mainFile), 'slotwire-headless.php exists');

  const content = readFileSync(mainFile, 'utf8');

  assert.match(content, /Plugin Name:\s*SlotWire Headless Companion/i);
  assert.match(content, /Version:\s*0\.2\.0/i);
  assert.match(content, /Requires at least:\s*5\.8/i);
  assert.match(content, /Requires PHP:\s*7\.4/i);
  assert.match(content, /License:\s*MIT/i);
  assert.match(content, /define\('SLOTWIRE_VERSION',\s*'0\.2\.0'\)/i);
});

test('WordPress Manifest: readme.txt standard WP format compliance', () => {
  const readmeFile = resolve(pluginRoot, 'readme.txt');
  assert.ok(existsSync(readmeFile), 'readme.txt exists');

  const content = readFileSync(readmeFile, 'utf8');

  assert.match(content, /===\s*SlotWire Headless Companion\s*===/i);
  assert.match(content, /Stable tag:\s*0\.2\.0/i);
  assert.match(content, /== Description ==/i);
  assert.match(content, /== Installation ==/i);
});

test('WordPress Manifest: distribution zip package exists and is valid', () => {
  const zipFile = resolve(pluginRoot, 'dist/slotwire-headless.zip');
  assert.ok(existsSync(zipFile), 'slotwire-headless.zip exists in dist/');

  const stats = statSync(zipFile);
  assert.ok(stats.size > 5000, `Zip file has reasonable size (${stats.size} bytes > 5KB)`);
});
