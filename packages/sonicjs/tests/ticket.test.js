import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSonicTicketCollectionConfig } from '../dist/scaffold.js';

test('sonicjs: generates slotwire_tickets schema config', () => {
  const collection = generateSonicTicketCollectionConfig();
  assert.equal(collection.name, 'slotwire_tickets');
  assert.equal(collection.slug, 'slotwire-tickets');
  assert.ok(collection.schema.properties.ticketId);
  assert.ok(collection.schema.properties.stagingUrl);
  assert.ok(collection.schema.properties.cmsEditUrl);
  assert.equal(collection.schema.required.includes('ticketId'), true);
});
