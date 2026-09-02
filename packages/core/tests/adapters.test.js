import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCmsDeepLink,
  getCmsAdapter,
  registerCmsAdapter,
  SonicJsAdapter,
  KeystaticAdapter,
  DecapAdapter,
  StrapiAdapter,
  PayloadAdapter,
} from '../dist/index.js';

test('SonicJsAdapter: generates direct document edit links', () => {
  const url = buildCmsDeepLink({
    provider: 'sonicjs',
    adminUrl: 'https://cms.example.com/admin',
    collection: 'feature_cards',
    documentId: 'card-srv-consulting',
    pageSlug: 'home',
    sectionKey: 'services',
  });

  assert.equal(
    url,
    'https://cms.example.com/admin/content/card-srv-consulting/edit?pageSlug=home&sectionKey=services'
  );
});

test('SonicJsAdapter: generates model list links for collection archetypes', () => {
  const url = buildCmsDeepLink({
    provider: 'sonicjs',
    adminUrl: 'https://cms.example.com/admin',
    collection: 'services',
    archetype: 'cards',
  });

  assert.equal(url, 'https://cms.example.com/admin/content?model=services');
});

test('SonicJsAdapter: generates new document creation link with composite query parameters', () => {
  const url = buildCmsDeepLink({
    provider: 'sonicjs',
    adminUrl: 'https://cms.example.com/admin',
    collection: 'page_sections',
    pageSlug: 'technology',
    sectionKey: 'stack',
    action: 'create',
  });

  assert.equal(
    url,
    'https://cms.example.com/admin/content/new?collection=page_sections&pageSlug=technology&sectionKey=stack'
  );
});

test('KeystaticAdapter: generates single item edit link', () => {
  const url = buildCmsDeepLink({
    provider: 'keystatic',
    adminUrl: '/keystatic',
    collection: 'services',
    documentId: 'srv-technical-consulting',
  });

  assert.equal(
    url,
    '/keystatic/collection/services/item/srv-technical-consulting'
  );
});

test('KeystaticAdapter: generates collection list link for card archetypes', () => {
  const url = buildCmsDeepLink({
    provider: 'keystatic',
    adminUrl: '/keystatic',
    collection: 'services',
    archetype: 'cards',
  });

  assert.equal(url, '/keystatic/collection/services');
});

test('KeystaticAdapter: generates create item link', () => {
  const url = buildCmsDeepLink({
    provider: 'keystatic',
    adminUrl: '/keystatic',
    collection: 'services',
    action: 'create',
  });

  assert.equal(url, '/keystatic/collection/services/create');
});

test('DecapAdapter / Sveltia: generates hash-based single entry edit link', () => {
  const url = buildCmsDeepLink({
    provider: 'decap',
    adminUrl: '/admin',
    collection: 'projects',
    documentId: 'splitphase',
  });

  assert.equal(url, '/admin/#/collections/projects/entries/splitphase');
});

test('DecapAdapter / Sveltia: handles sveltia alias and collection list', () => {
  const url = buildCmsDeepLink({
    provider: 'sveltia',
    adminUrl: '/admin',
    collection: 'projects',
    archetype: 'cards',
  });

  assert.equal(url, '/admin/#/collections/projects');
});

test('DecapAdapter: generates new entry link', () => {
  const url = buildCmsDeepLink({
    provider: 'decap',
    adminUrl: '/admin',
    collection: 'projects',
    action: 'create',
  });

  assert.equal(url, '/admin/#/collections/projects/new');
});

test('StrapiAdapter: generates collectionType edit link', () => {
  const url = buildCmsDeepLink({
    provider: 'strapi',
    adminUrl: 'https://strapi.example.com/admin',
    collection: 'services',
    documentId: '123',
    action: 'edit',
  });

  assert.equal(
    url,
    'https://strapi.example.com/admin/content-manager/collectionType/api::services.services/123'
  );
});

test('PayloadAdapter: generates collections edit link', () => {
  const url = buildCmsDeepLink({
    provider: 'payload',
    adminUrl: 'https://payload.example.com/admin',
    collection: 'posts',
    documentId: '65f123abc',
    action: 'edit',
  });

  assert.equal(
    url,
    'https://payload.example.com/admin/collections/posts/65f123abc'
  );
});

test('DirectusAdapter: generates item edit link', () => {
  const url = buildCmsDeepLink({
    provider: 'directus',
    adminUrl: 'https://directus.example.com/admin',
    collection: 'services',
    documentId: 'srv-technical-consulting',
    action: 'edit',
  });

  assert.equal(
    url,
    'https://directus.example.com/admin/content/services/srv-technical-consulting'
  );
});

test('DirectusAdapter: generates collection list link for card archetypes', () => {
  const url = buildCmsDeepLink({
    provider: 'directus',
    adminUrl: 'https://directus.example.com/admin',
    collection: 'services',
    archetype: 'cards',
  });

  assert.equal(
    url,
    'https://directus.example.com/admin/content/services'
  );
});

test('DirectusAdapter: generates create new item link with /+', () => {
  const url = buildCmsDeepLink({
    provider: 'directus',
    adminUrl: 'https://directus.example.com/admin',
    collection: 'services',
    action: 'create',
  });

  assert.equal(
    url,
    'https://directus.example.com/admin/content/services/+'
  );
});

test('Custom Adapter Registration: registerCmsAdapter', () => {
  registerCmsAdapter({
    provider: 'custom_cms',
    buildAdminLink(opts) {
      return `https://custom.example.com/${opts.collection}/${opts.documentId || 'list'}`;
    },
  });

  const adapter = getCmsAdapter('custom_cms');
  assert.equal(adapter.provider, 'custom_cms');

  const link = buildCmsDeepLink({
    provider: 'custom_cms',
    collection: 'docs',
    documentId: 'doc-1',
  });
  assert.equal(link, 'https://custom.example.com/docs/doc-1');
});
