import { mkdirSync, cpSync, rmSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pluginRoot = resolve(__dirname, '..');
const distDir = resolve(pluginRoot, 'dist');
const stagingDir = resolve(distDir, 'slotwire-headless');
const zipFile = resolve(distDir, 'slotwire-headless.zip');

console.log('📦 Building SlotWire WordPress distribution package...');

// 1. Prepare dist & staging directories
if (existsSync(distDir)) {
  try {
    rmSync(distDir, { recursive: true, force: true });
  } catch {
    // ignore if locked
  }
}
mkdirSync(stagingDir, { recursive: true });

// 2. Copy production plugin files
const filesToCopy = [
  'slotwire-headless.php',
  'readme.txt',
  'includes',
  'assets',
];

for (const item of filesToCopy) {
  const src = resolve(pluginRoot, item);
  const dest = resolve(stagingDir, item);
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
  }
}

// 3. Create zip file using native zip CLI
try {
  execSync(`cd "${distDir}" && zip -r -q "slotwire-headless.zip" "slotwire-headless"`, {
    stdio: 'inherit',
  });

  // Clean staging directory
  rmSync(stagingDir, { recursive: true, force: true });

  const stats = statSync(zipFile);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`✓ Successfully created ${zipFile} (${sizeKb} KB)`);
} catch (err) {
  console.error('Failed to create zip package:', err);
  process.exit(1);
}
