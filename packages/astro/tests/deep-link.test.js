import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCmsDeepLink } from '../dist/deep-link.js';

test('buildCmsDeepLink: SonicJS creation link with composite keys', () => {
  const url = buildCmsDeepLink({
    provider: 'sonicjs',
    adminUrl: 'https://cms.brainendeavor.com/admin',
    collection: 'feature_cards',
    pageSlug: 'technology',
    sectionKey: 'stack',
    action: 'create',
  });

  assert.equal(
    url,
    'https://cms.brainendeavor.com/admin/content/documents/feature_cards/new?pageSlug=technology&sectionKey=stack'
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
    'https://cms.brainendeavor.com/admin/content/documents/feature_cards/doc-stack-1?pageSlug=technology'
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
