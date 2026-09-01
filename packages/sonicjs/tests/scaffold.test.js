import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaffoldBlueprint, generateSonicNavigationCollectionConfig, scaffoldAllSonicCollections } from '../dist/scaffold.js';

test('scaffoldBlueprint: mock D1 database execution', async () => {
  const mockInserted = [];
  const mockD1 = {
    prepare: (sql) => ({
      bind: (...args) => ({
        run: async () => {
          mockInserted.push({ sql, args });
          return { success: true };
        },
      }),
    }),
  };

  const sampleBlueprint = {
    archetypeKey: 'service_page',
    targetSlug: 'ai-platform',
    targetTitle: 'AI Platform Solutions',
    totalToCreate: 2,
    totalToReuse: 1,
    items: [
      {
        id: 'draft-ai-platform',
        collection: 'pages',
        action: 'create',
        pageSlug: 'ai-platform',
        data: { slug: 'ai-platform', title: 'AI Platform Solutions', status: 'draft' },
      },
      {
        id: 'draft-ai-platform-hero',
        collection: 'page_sections',
        action: 'create',
        pageSlug: 'ai-platform',
        sectionKey: 'hero',
        data: { pageSlug: 'ai-platform', sectionKey: 'hero', title: 'Hero Section', status: 'draft' },
      },
      {
        id: 'ref-testimonials',
        collection: 'testimonials',
        action: 'reference',
        pageSlug: 'ai-platform',
        data: { featured: true },
      },
    ],
  };

  const result = await scaffoldBlueprint(sampleBlueprint, { d1: mockD1 });

  assert.equal(result.success, true);
  assert.equal(result.targetSlug, 'ai-platform');
  assert.equal(result.createdCount, 2);
  assert.equal(result.reusedCount, 1);
  assert.equal(mockInserted.length, 2);
});

test('sonicjs: generates site_navigation schema config', () => {
  const navConfig = generateSonicNavigationCollectionConfig();
  assert.equal(navConfig.name, 'site_navigation');
  assert.ok(navConfig.schema.properties.menuKey);
  assert.ok(navConfig.schema.properties.link);
  assert.ok(navConfig.schema.properties.title);

  const all = scaffoldAllSonicCollections({
    cms: { provider: 'sonicjs', apiUrl: 'http://localhost' },
    slots: {},
  });
  const hasNav = all.some((c) => c.name === 'site_navigation');
  assert.ok(hasNav, 'Expected site_navigation collection in scaffoldAllSonicCollections');
});

