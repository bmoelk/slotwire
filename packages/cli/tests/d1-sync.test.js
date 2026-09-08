import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateD1ViewsSql } from '../dist/d1-sync.js';
import { defineContract, s } from '@slotwire/core';

const mockConfig = defineContract({
  cms: {
    provider: 'slottd',
    apiUrl: 'https://cms.test',
  },
  archetypes: {
    service: s.page({
      template: 'service',
      slots: {
        hero: s.section({
          key: 'hero',
          defaultTitle: 'Hero',
          defaultData: {
            headline: 'Transform your business',
            ctaText: 'Get Started',
          },
        }),
      },
    }),
  },
  navigation: s.navigation({
    collection: 'site_navigation',
  }),
  slots: {
    pages: s.collection('pages', {
      title: s.string(),
      slug: s.slug(),
      description: s.string().optional(),
      template: s.string().optional(),
    }),
  },
});

test('generateD1ViewsSql: creates views for all collections with json_extract', () => {
  const sql = generateD1ViewsSql(mockConfig);

  assert.ok(sql.includes('DROP VIEW IF EXISTS view_pages;'));
  assert.ok(sql.includes('CREATE VIEW view_pages AS'));
  assert.ok(sql.includes("json_extract(data, '$.description') AS description"));
  assert.ok(sql.includes("json_extract(data, '$.template') AS template"));
  assert.ok(sql.includes("WHERE collection = 'pages';"));

  assert.ok(sql.includes('DROP VIEW IF EXISTS view_page_sections;'));
  assert.ok(sql.includes('CREATE VIEW view_page_sections AS'));
  assert.ok(sql.includes("json_extract(data, '$.headline') AS headline"));
  assert.ok(sql.includes("json_extract(data, '$.ctaText') AS ctaText"));
  assert.ok(sql.includes("WHERE collection = 'page_sections';"));

  assert.ok(sql.includes('DROP VIEW IF EXISTS view_site_navigation;'));
  assert.ok(sql.includes('CREATE VIEW view_site_navigation AS'));
  assert.ok(sql.includes("json_extract(data, '$.link') AS link"));
  assert.ok(sql.includes("json_extract(data, '$.menuKey') AS menuKey"));
  assert.ok(sql.includes("WHERE collection = 'site_navigation';"));
});

test('generateD1ViewsSql: respects custom view prefix', () => {
  const sql = generateD1ViewsSql(mockConfig, { viewPrefix: 'v_' });

  assert.ok(sql.includes('DROP VIEW IF EXISTS v_pages;'));
  assert.ok(sql.includes('CREATE VIEW v_pages AS'));
  assert.ok(!sql.includes('view_pages;'));
});
