import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { extractSlotsFromHtml, scanHtmlDirectory } from '../dist/scanner.js';
import { formatConsoleReport } from '../dist/report.js';

test('extractSlotsFromHtml: accurately parses populated, fallback, and ghost slot declarations', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <body>
        <section 
          data-slotwire-slot="about_hero"
          data-slotwire-archetype="section"
          data-slotwire-collection="page_sections"
          data-slotwire-page="about"
          data-slotwire-section="hero"
          data-slotwire-source="cms"
          data-slotwire-id="doc-123"
        >
          <h1>About Us</h1>
        </section>

        <div 
          data-slotwire-slot="about_projects"
          data-slotwire-source="fallback"
        >
          <span>Fallback Projects</span>
        </div>

        <div 
          class="slotwire-ghost-slot"
          data-slotwire-ghost="true"
          data-slotwire-slot="about_cards"
          data-slotwire-archetype="feature_cards"
          data-slotwire-collection="feature_cards"
          data-slotwire-page="about"
        >
          <span>Ghost Slot</span>
        </div>
      </body>
    </html>
  `;

  const slots = extractSlotsFromHtml(sampleHtml);
  assert.equal(slots.length, 3);

  const populated = slots.find((s) => s.slot === 'about_hero');
  assert.ok(populated);
  assert.equal(populated.source, 'cms');
  assert.equal(populated.isGhost, false);

  const fallback = slots.find((s) => s.slot === 'about_projects');
  assert.ok(fallback);
  assert.equal(fallback.source, 'fallback');
  assert.equal(fallback.isGhost, false);

  const ghost = slots.find((s) => s.slot === 'about_cards');
  assert.ok(ghost);
  assert.equal(ghost.source, 'ghost');
  assert.equal(ghost.isGhost, true);
});

test('scanHtmlDirectory: audits multi-route directory and enforces strict quality gate', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'slotwire-scan-test-'));

  try {
    // 1. Clean route (Home)
    const homeHtml = `
      <html>
        <body>
          <div data-slotwire-slot="home_hero" data-slotwire-source="cms">Hero</div>
          <div data-slotwire-slot="home_bento" data-slotwire-source="cms">Bento</div>
        </body>
      </html>
    `;
    await fs.writeFile(path.join(tempDir, 'index.html'), homeHtml);

    // 2. Incomplete route (Services)
    const servicesDir = path.join(tempDir, 'services');
    await fs.mkdir(servicesDir);
    const servicesHtml = `
      <html>
        <body>
          <div data-slotwire-slot="service_hero" data-slotwire-source="cms">Hero</div>
          <div data-slotwire-slot="service_projects" data-slotwire-source="fallback">Fallback</div>
          <div class="slotwire-ghost-slot" data-slotwire-ghost="true" data-slotwire-slot="service_cards">Ghost</div>
        </body>
      </html>
    `;
    await fs.writeFile(path.join(servicesDir, 'index.html'), servicesHtml);

    // Non-strict Scan
    const resultNonStrict = await scanHtmlDirectory(tempDir, { strict: false });
    assert.equal(resultNonStrict.totalRoutes, 2);
    assert.equal(resultNonStrict.totalSlots, 5);
    assert.equal(resultNonStrict.cmsSlots, 3);
    assert.equal(resultNonStrict.fallbackSlots, 1);
    assert.equal(resultNonStrict.ghostSlots, 1);
    assert.equal(resultNonStrict.isClean, true);

    // Strict Scan (Quality Gate fails on ghost slots and fallbacks)
    const resultStrict = await scanHtmlDirectory(tempDir, { strict: true });
    assert.equal(resultStrict.isClean, false);
    assert.ok(resultStrict.errors.length > 0);

    // Verify Console Report formatting
    const consoleOutput = formatConsoleReport(resultStrict, { strict: true });
    assert.ok(consoleOutput.includes('SlotWire Content Completeness'));
    assert.ok(consoleOutput.includes('PRE-DEPLOY QUALITY GATE FAILED'));
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
