import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCmsDeepLink } from '../dist/deep-link.js';

test('buildCmsDeepLink: SonicJS creation link with composite keys', () => {
  const url = buildCmsDeepLink({
    provider: 'sonicjs',
    adminUrl: 'https://cms.brainendeavor.com/admin',
    collection: 'page_sections',
    pageSlug: 'technology',
    sectionKey: 'stack',
    action: 'create',
  });

  assert.equal(
    url,
    'https://cms.brainendeavor.com/admin/content/new?collection=page_sections&pageSlug=technology&sectionKey=stack'
  );
});

test('buildCmsDeepLink: SonicJS collection archetype routes to model list', () => {
  const url = buildCmsDeepLink({
    provider: 'sonicjs',
    adminUrl: 'https://cms.brainendeavor.com/admin',
    collection: 'services',
    archetype: 'cards',
  });

  assert.equal(
    url,
    'https://cms.brainendeavor.com/admin/content?model=services'
  );
});

test('buildCmsDeepLink: SonicJS edit link with documentId', () => {
  const url = buildCmsDeepLink({
    provider: 'sonicjs',
    adminUrl: 'https://cms.brainendeavor.com/admin',
    collection: 'feature_cards',
    documentId: 'doc-stack-1',
    pageSlug: 'technology',
    action: 'edit',
  });

  assert.equal(
    url,
    'https://cms.brainendeavor.com/admin/content/doc-stack-1/edit?pageSlug=technology'
  );
});

test('buildCmsDeepLink: Strapi create link', () => {
  const url = buildCmsDeepLink({
    provider: 'strapi',
    adminUrl: 'https://strapi.example.com/admin',
    collection: 'page_sections',
    pageSlug: 'about',
    sectionKey: 'philosophy',
    action: 'create',
  });

  assert.equal(
    url,
    'https://strapi.example.com/admin/content-manager/collectionType/api::page_sections.page_sections/create?pageSlug=about&sectionKey=philosophy'
  );
});

test('buildCmsDeepLink: Payload CMS edit link', () => {
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

test('buildCmsDeepLink: Keystatic item edit link', () => {
  const url = buildCmsDeepLink({
    provider: 'keystatic',
    adminUrl: '/keystatic',
    collection: 'posts',
    documentId: 'my-first-post',
  });

  assert.equal(
    url,
    '/keystatic/collection/posts/item/my-first-post'
  );
});

test('buildCmsDeepLink: Decap CMS entry edit link', () => {
  const url = buildCmsDeepLink({
    provider: 'decap',
    adminUrl: '/admin',
    collection: 'services',
    documentId: 'technical-consulting',
  });

  assert.equal(
    url,
    '/admin/#/collections/services/entries/technical-consulting'
  );
});

test('buildCmsDeepLink: Directus item edit link', () => {
  const url = buildCmsDeepLink({
    provider: 'directus',
    adminUrl: 'https://directus.example.com/admin',
    collection: 'projects',
    documentId: 'splitphase',
  });

  assert.equal(
    url,
    'https://directus.example.com/admin/content/projects/splitphase'
  );
});


