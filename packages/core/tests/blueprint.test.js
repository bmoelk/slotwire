import { test } from 'node:test';
import assert from 'node:assert/strict';
import { s, defineContract, generateBlueprint } from '../dist/index.js';

test('generateBlueprint: resolves cascade and reference strategies for nested archetypes', () => {
  const contract = defineContract({
    cms: {
      provider: 'sonicjs',
      apiUrl: 'https://cms.brainendeavor.com',
    },
    slots: {
      home_hero: s.object({
        title: s.string(),
      }),
    },
    archetypes: {
      service_page: s.page({
        collection: 'pages',
        slots: {
          hero: s.section({ key: 'hero', strategy: 'cascade' }),
          features: s.section({
            key: 'features',
            strategy: 'cascade',
            children: {
              cards: {
                collection: 'feature_cards',
                defaultCount: 3,
              },
            },
          }),
          testimonials: s.singleton('testimonials', {
            strategy: 'reference',
          }),
        },
      }),
    },
  });

  const blueprint = generateBlueprint(contract, 'service_page', {
    targetSlug: 'mobile-apps',
    targetTitle: 'Mobile Application Architecture',
  });

  assert.equal(blueprint.targetSlug, 'mobile-apps');
  assert.equal(blueprint.targetTitle, 'Mobile Application Architecture');
  assert.equal(blueprint.totalToReuse, 1);
  // Root page (1) + Hero section (1) + Features section (1) + 3x feature cards (3) = 6 to create
  assert.equal(blueprint.totalToCreate, 6);

  const rootItem = blueprint.items.find((i) => i.slotKey === 'root_page');
  assert.ok(rootItem);
  assert.equal(rootItem.collection, 'pages');
  assert.equal(rootItem.pageSlug, 'mobile-apps');

  const cardsItems = blueprint.items.filter((i) => i.collection === 'feature_cards');
  assert.equal(cardsItems.length, 3);
  assert.equal(cardsItems[0].sectionKey, 'features');
  assert.equal(cardsItems[0].pageSlug, 'mobile-apps');

  const refItem = blueprint.items.find((i) => i.action === 'reference');
  assert.ok(refItem);
  assert.equal(refItem.collection, 'testimonials');
});
