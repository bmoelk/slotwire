import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slotwireLoader } from '../dist/loader.js';
import { defineContract, s, registerCmsAdapter, BaseCmsAdapter } from '@slotwire/core';

const mockConfig = defineContract({
  cms: {
    provider: 'mock-cms',
    apiUrl: 'https://mock.cms.test',
  },
  slots: {
    pages: s.collection('pages', {
      title: s.string(),
      slug: s.slug(),
      description: s.string().optional(),
    }),
  },
});

class MockCmsAdapter extends BaseCmsAdapter {
  provider = 'mock-cms';

  buildAdminLink() {
    return 'https://mock.cms.test/admin';
  }

  async fetchCollection(collection, options) {
    if (collection === 'pages') {
      return [
        { id: '1', slug: 'home', title: 'Home Page' },
        { id: '2', slug: 'about', title: 'About Us', description: 'Our story' },
      ];
    }
    return [];
  }
}

registerCmsAdapter(new MockCmsAdapter());

test('slotwireLoader: creates loader with inferred Zod schema and name', () => {
  const loader = slotwireLoader({
    collection: 'pages',
    config: mockConfig,
  });

  assert.equal(loader.name, 'slotwire-loader-pages');
  assert.ok(typeof loader.schema === 'function', 'Loader schema should be a function');

  const schema = loader.schema();
  assert.ok(schema, 'Schema should be returned');

  const valid = schema.safeParse({ title: 'Pricing', slug: 'pricing' });
  assert.ok(valid.success, 'Valid entry should pass schema');

  const invalid = schema.safeParse({ slug: 'pricing' });
  assert.equal(invalid.success, false, 'Missing title should fail');
});

test('slotwireLoader: loads items into store with normalized IDs', async () => {
  const loader = slotwireLoader({
    collection: 'pages',
    config: mockConfig,
  });

  const stored = new Map();
  const mockContext = {
    store: {
      set: ({ id, data }) => {
        stored.set(id, data);
      },
    },
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    parseData: async ({ id, data }) => data,
  };

  await loader.load(mockContext);

  assert.equal(stored.size, 2);
  assert.ok(stored.has('home'));
  assert.equal(stored.get('home').title, 'Home Page');
  assert.ok(stored.has('about'));
  assert.equal(stored.get('about').description, 'Our story');
});

test('slotwireLoader: applies optional transform callback', async () => {
  const loader = slotwireLoader({
    collection: 'pages',
    config: mockConfig,
    transform: (item) => ({
      ...item,
      title: item.title.toUpperCase(),
    }),
  });

  const stored = new Map();
  const mockContext = {
    store: {
      set: ({ id, data }) => {
        stored.set(id, data);
      },
    },
  };

  await loader.load(mockContext);

  assert.equal(stored.get('home').title, 'HOME PAGE');
});
