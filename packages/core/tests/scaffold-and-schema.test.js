import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defineContract,
  s,
  getSlotEntryZodSchema,
  generateArchetypeScaffoldBundle,
  WordPressAdapter,
  DirectusAdapter,
  buildCmsDeepLink,
} from '../dist/index.js';

const mockConfig = defineContract({
  cms: {
    provider: 'slottd',
    apiUrl: 'https://cms.example.com',
  },
  archetypes: {
    bento: s.page({
      template: 'bento',
      description: 'Bento Grid Marketing Layout',
      slots: {
        hero: s.section({
          key: 'hero',
          defaultTitle: 'Starter Hero Headline',
          defaultDescription: 'Explain core value proposition.',
          defaultPrimaryCtaText: 'Get Started',
          defaultPrimaryCtaUrl: '/contact',
        }),
        features: s.section({
          key: 'features',
          defaultTitle: 'Key Features',
          children: s.collection('feature_cards', {
            title: s.string(),
            summary: s.string(),
          }),
        }),
      },
    }),
  },
  navigation: s.navigation({
    collection: 'site_navigation',
    menus: ['header_main', 'footer_primary'],
  }),
  slots: {
    pages: s.collection('pages', {
      title: s.string(),
      slug: s.slug(),
      description: s.string().optional(),
    }),
    hero: s.object({
      title: s.string(),
      tagline: s.string().optional(),
      primaryCtaUrl: s.url().optional(),
    }),
  },
});

test('getSlotEntryZodSchema: extracts non-array Zod object schema for collection slot', () => {
  const schema = getSlotEntryZodSchema(mockConfig, 'pages');
  assert.ok(schema, 'Schema should be defined');

  // Valid item passes
  const valid = schema.safeParse({
    title: 'About Us',
    slug: 'about-us',
    description: 'Company info',
    extraCmsMetadata: 123, // Passthrough permits extra fields
  });
  assert.ok(valid.success, 'Valid entry should parse successfully');

  // Missing required title fails
  const invalid = schema.safeParse({
    slug: 'invalid-post',
  });
  assert.equal(invalid.success, false, 'Missing required field should fail validation');
});

test('getSlotEntryZodSchema: extracts Zod schema for object slot', () => {
  const schema = getSlotEntryZodSchema(mockConfig, 'hero');
  assert.ok(schema, 'Object schema should be defined');

  const valid = schema.safeParse({
    title: 'Hero Title',
    tagline: 'Subtitle here',
  });
  assert.ok(valid.success, 'Valid hero should parse');
});

test('generateArchetypeScaffoldBundle: generates atomic records for pages, sections, and navigation', () => {
  const bundle = generateArchetypeScaffoldBundle(mockConfig, 'bento', {
    pageSlug: 'solutions',
    title: 'Solutions Overview',
    addToNav: true,
    navMenu: 'header_main',
  });

  assert.equal(bundle.slug, 'solutions');
  assert.equal(bundle.title, 'Solutions Overview');
  assert.equal(bundle.template, 'bento');
  assert.equal(bundle.previewUrl, '/solutions?slotwire_preview=true');

  // Verify records
  const pageRec = bundle.records.find((r) => r.collection === 'pages');
  assert.ok(pageRec, 'Master pages record must exist');
  assert.equal(pageRec.data.slug, 'solutions');
  assert.equal(pageRec.data.title, 'Solutions Overview');

  const heroRec = bundle.records.find((r) => r.collection === 'page_sections' && r.data.sectionKey === 'hero');
  assert.ok(heroRec, 'Hero section record must exist');
  assert.equal(heroRec.data.pageSlug, 'solutions');
  assert.equal(heroRec.data.title, 'Starter Hero Headline');

  const navRec = bundle.records.find((r) => r.collection === 'site_navigation');
  assert.ok(navRec, 'Navigation record must exist');
  assert.equal(navRec.data.link, '/solutions');
  assert.equal(navRec.data.menuKey, 'header_main');
});

test('WordPressAdapter: generates admin edit and create links', () => {
  const editUrl = buildCmsDeepLink({
    provider: 'wordpress',
    adminUrl: 'https://cms.wp.com',
    collection: 'pages',
    documentId: '105',
  });
  assert.equal(editUrl, 'https://cms.wp.com/wp-admin/post.php?post=105&action=edit');

  const createUrl = buildCmsDeepLink({
    provider: 'wordpress',
    adminUrl: 'https://cms.wp.com',
    collection: 'pages',
    action: 'create',
  });
  assert.equal(createUrl, 'https://cms.wp.com/wp-admin/post-new.php?post_type=page');

  const navUrl = buildCmsDeepLink({
    provider: 'wordpress',
    adminUrl: 'https://cms.wp.com',
    collection: 'site_navigation',
  });
  assert.equal(navUrl, 'https://cms.wp.com/wp-admin/nav-menus.php');
});

test('DirectusAdapter: scaffoldBundle executes and rolls back on failure', async () => {
  const adapter = new DirectusAdapter();
  const createdCalls = [];
  const deletedCalls = [];

  // Mock global fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === 'POST') {
      createdCalls.push(url);
      if (createdCalls.length === 2) {
        // Simulate failure on second item
        return {
          ok: false,
          status: 422,
          text: async () => 'Validation error on item 2',
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 'created-id-1' } }),
      };
    }
    if (opts.method === 'DELETE') {
      deletedCalls.push(url);
      return { ok: true, status: 204 };
    }
    return { ok: true, json: async () => ({}) };
  };

  try {
    const bundle = {
      template: 'test',
      slug: 'test-slug',
      title: 'Test',
      records: [
        { collection: 'pages', data: { slug: 'test-slug', title: 'Test' } },
        { collection: 'page_sections', data: { pageSlug: 'test-slug', sectionKey: 'hero' } },
      ],
    };

    const result = await adapter.scaffoldBundle(bundle, { apiUrl: 'https://directus.test' });
    assert.equal(result.status, 'error');
    assert.equal(result.success, false);
    assert.ok(createdCalls.length >= 2, 'Should have attempted at least 2 creates');
    assert.ok(deletedCalls.length >= 1, 'Should have rolled back the first created record');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
