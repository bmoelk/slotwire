import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { extractSlotsFromHtml, scanHtmlDirectory } from '../dist/scanner.js';
import { formatConsoleReport } from '../dist/report.js';

test('extractSlotsFromHtml: accurately parses populated and ghost slot declarations', () => {
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
          data-slotwire-id="doc-123"
        >
          <h1>About Us</h1>
        </section>

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
  assert.equal(slots.length, 2);

  const populated = slots.find((s) => s.slot === 'about_hero');
  assert.ok(populated);
  assert.equal(populated.isGhost, false);
  assert.equal(populated.archetype, 'section');
  assert.equal(populated.collection, 'page_sections');
  assert.equal(populated.pageSlug, 'about');
  assert.equal(populated.documentId, 'doc-123');

  const ghost = slots.find((s) => s.slot === 'about_cards');
  assert.ok(ghost);
  assert.equal(ghost.isGhost, true);
  assert.equal(ghost.archetype, 'feature_cards');
  assert.equal(ghost.collection, 'feature_cards');
});

test('scanHtmlDirectory: audits multi-route directory and enforces strict quality gate', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'slotwire-scan-test-'));

  try {
    // 1. Clean route (Home)
    const homeHtml = `
      <html>
        <body>
          <div data-slotwire-slot="home_hero" data-slotwire-collection="page_sections">Hero</div>
          <div data-slotwire-slot="home_bento" data-slotwire-collection="feature_cards">Bento</div>
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
          <div data-slotwire-slot="service_hero" data-slotwire-collection="page_sections">Hero</div>
          <div class="slotwire-ghost-slot" data-slotwire-ghost="true" data-slotwire-slot="service_cards" data-slotwire-collection="feature_cards">Ghost</div>
        </body>
      </html>
    `;
    await fs.writeFile(path.join(servicesDir, 'index.html'), servicesHtml);

    // Non-strict Scan
    const resultNonStrict = await scanHtmlDirectory(tempDir, { strict: false });
    assert.equal(resultNonStrict.totalRoutes, 2);
    assert.equal(resultNonStrict.totalSlots, 4);
    assert.equal(resultNonStrict.populatedSlots, 3);
    assert.equal(resultNonStrict.ghostSlots, 1);
    assert.equal(resultNonStrict.isClean, true);

    // Strict Scan (Quality Gate)
    const resultStrict = await scanHtmlDirectory(tempDir, { strict: true });
    assert.equal(resultStrict.isClean, false);
    assert.ok(resultStrict.errors.length > 0);
    assert.ok(resultStrict.errors[0].includes("Route '/services' has 1 unpopulated ghost slot"));

    // Verify Console Report formatting
    const consoleOutput = formatConsoleReport(resultStrict, { strict: true });
    assert.ok(consoleOutput.includes('SlotWire Automated Site Audit'));
    assert.ok(consoleOutput.includes('PRE-DEPLOY QUALITY GATE FAILED'));
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
