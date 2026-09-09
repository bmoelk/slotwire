import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defineContract,
  s,
  resolveSlotTransformer,
  resolveSlotEditor,
} from '../dist/index.js';

test('resolveSlotTransformer: executes slot-level transformer function', () => {
  const config = defineContract({
    cms: {
      provider: 'custom',
      apiUrl: 'https://cms.test',
    },
    slots: {
      projects: s.collection('projects', {
        title: s.string(),
        description: s.string(),
      }, {
        transform: (item) => ({
          ...item,
          title: item.raw_title.toUpperCase(),
          description: item.raw_desc.trim(),
        }),
      }),
    },
  });

  const transformer = resolveSlotTransformer(config, 'projects');
  const result = transformer({ raw_title: 'awesome project', raw_desc: '  cleaned copy  ' }, {
    slotKey: 'projects',
    collection: 'projects',
  });

  assert.equal(result.title, 'AWESOME PROJECT');
  assert.equal(result.description, 'cleaned copy');
});

test('resolveSlotTransformer: applies provider-level transformer across CMS collections', () => {
  const config = defineContract({
    cms: {
      provider: 'wordpress',
      apiUrl: 'https://cms.test',
    },
    transformers: {
      // Universal WordPress cleaner: flattens rendered objects and strips wpautop noise
      wordpress: (raw) => {
        if (!raw || typeof raw !== 'object') return raw;
        const title = typeof raw.title === 'object' ? raw.title.rendered : raw.title;
        let content = typeof raw.content === 'object' ? raw.content.rendered : raw.content;
        if (typeof content === 'string') {
          content = content.replace(/<br\s*\/?>/gi, ' ').replace(/<p>\s*<\/p>/gi, '').trim();
        }
        return { ...raw, title, content };
      },
    },
    slots: {
      pages: s.collection('pages', {
        title: s.string(),
        content: s.string(),
      }),
    },
  });

  const transformer = resolveSlotTransformer(config, 'pages');
  const dirtyWpRecord = {
    id: 42,
    title: { rendered: 'About Us' },
    content: { rendered: '<p>Welcome</p><br><br/><p></p>' },
  };

  const result = transformer(dirtyWpRecord, { slotKey: 'pages', collection: 'pages' });
  assert.equal(result.title, 'About Us');
  assert.equal(result.content, '<p>Welcome</p>');
});

test('resolveSlotTransformer: normalizes Strapi v4 attributes wrapper', () => {
  const config = defineContract({
    cms: {
      provider: 'strapi',
      apiUrl: 'https://cms.test',
    },
    transformers: {
      strapi: (raw) => {
        if (!raw || !raw.attributes) return raw;
        return { id: raw.id, ...raw.attributes };
      },
    },
    slots: {
      articles: s.collection('articles', {
        title: s.string(),
      }),
    },
  });

  const transformer = resolveSlotTransformer(config, 'articles');
  const rawStrapiItem = {
    id: 101,
    attributes: {
      title: 'Headless CMS Architecture',
      slug: 'headless-cms-architecture',
      publishedAt: '2026-09-08',
    },
  };

  const result = transformer(rawStrapiItem, { slotKey: 'articles', collection: 'articles' });
  assert.equal(result.id, 101);
  assert.equal(result.title, 'Headless CMS Architecture');
  assert.equal(result.slug, 'headless-cms-architecture');
});

test('resolveSlotTransformer: slot-level transformer takes precedence over provider transformer', () => {
  const config = defineContract({
    cms: {
      provider: 'wordpress',
      apiUrl: 'https://cms.test',
    },
    transformers: {
      wordpress: (raw) => ({ ...raw, title: 'From Provider' }),
    },
    slots: {
      hero: s.section({
        key: 'hero',
        transform: (raw) => ({ ...raw, title: 'From Slot Definition' }),
      }),
    },
  });

  const transformer = resolveSlotTransformer(config, 'hero');
  const result = transformer({ title: 'Original' }, { slotKey: 'hero', collection: 'page_sections' });
  assert.equal(result.title, 'From Slot Definition');
});

test('resolveSlotTransformer: falls back to identity function when no transformer configured', () => {
  const config = defineContract({
    cms: {
      provider: 'directus',
      apiUrl: 'https://cms.test',
    },
    slots: {
      team: s.collection('team', { name: s.string() }),
    },
  });

  const transformer = resolveSlotTransformer(config, 'team');
  const item = { id: 1, name: 'Alice' };
  assert.equal(transformer(item, { slotKey: 'team', collection: 'team' }), item);
});

test('resolveSlotEditor: resolves html for wordpress and markdown for others', () => {
  const wpConfig = defineContract({
    cms: { provider: 'wordpress', apiUrl: 'https://cms.test' },
    slots: {},
  });
  assert.equal(resolveSlotEditor(wpConfig, 'hero'), 'html');

  const directusConfig = defineContract({
    cms: { provider: 'directus', apiUrl: 'https://cms.test' },
    slots: {},
  });
  assert.equal(resolveSlotEditor(directusConfig, 'hero'), 'markdown');

  const explicitHtmlConfig = defineContract({
    cms: { provider: 'directus', apiUrl: 'https://cms.test' },
    ui: { editor: 'html' },
    slots: {},
  });
  assert.equal(resolveSlotEditor(explicitHtmlConfig, 'hero'), 'html');

  const slotOverrideConfig = defineContract({
    cms: { provider: 'directus', apiUrl: 'https://cms.test' },
    slots: {
      custom: s.section({ key: 'custom', editor: 'html' }),
    },
  });
  assert.equal(resolveSlotEditor(slotOverrideConfig, 'custom'), 'html');
});
