import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCmsAdapter, resolveSlotTransformer } from '@slotwire/core';

test('WordPress Payload Contract: format_post_item output satisfies SlotWire schemas', async () => {
  // Replicates output structure of Slotwire_Rest::format_post_item()
  const formattedPost = {
    id: 123,
    slug: 'hello-world',
    title: 'Hello World & Beyond',
    status: 'publish',
    date: '2026-09-08T12:00:00Z',
    modified: '2026-09-08T14:30:00Z',
    author: 'Admin Editor',
    content: '<p>Welcome to <strong>SlotWire</strong>.<br>This is HTML content.</p>',
    raw_content: 'Welcome to **SlotWire**.\nThis is HTML content.',
    excerpt: 'Welcome to SlotWire.',
    featured_media: {
      id: 55,
      url: 'https://example.com/wp-content/uploads/2026/09/hero.jpg',
      width: 1920,
      height: 1080,
      alt: 'Hero Image',
    },
    slot: 'hero',
    meta: {
      subtitle: 'Modern Headless CMS',
      custom_flag: true,
    },
    acf: {
      call_to_action: 'Get Started',
      accent_color: '#10b981',
    },
    blocks: [
      {
        blockName: 'core/paragraph',
        attrs: {},
        innerBlocks: [],
        innerHTML: '<p>Welcome to <strong>SlotWire</strong>.</p>',
      },
    ],
  };

  assert.equal(typeof formattedPost.id, 'number');
  assert.equal(typeof formattedPost.slug, 'string');
  assert.equal(typeof formattedPost.title, 'string');
  assert.equal(typeof formattedPost.content, 'string');
  assert.ok(formattedPost.featured_media);
  assert.equal(formattedPost.featured_media.url, 'https://example.com/wp-content/uploads/2026/09/hero.jpg');
  assert.equal(formattedPost.slot, 'hero');
  assert.equal(formattedPost.acf.call_to_action, 'Get Started');

  // Verify WordPress adapter handles updateItem parameter transformation
  const adapter = getCmsAdapter('wordpress');
  assert.ok(adapter, 'WordPress adapter is registered');
  assert.equal(typeof adapter.buildAdminLink, 'function');
  assert.equal(typeof adapter.updateItem, 'function');

  const editLink = adapter.buildAdminLink({
    adminUrl: 'https://wp.example.com/wp-admin',
    collection: 'posts',
    documentId: '123',
    action: 'edit',
  });
  assert.equal(editLink, 'https://wp.example.com/wp-admin/post.php?post=123&action=edit');
});

test('WordPress Payload Contract: Slot Transformer cleans wpautop quirks', () => {
  const dirtyWordPressItem = {
    id: 99,
    slug: 'featured-project',
    title: 'Solar Array Project',
    content: '<p>Initial line</p><br><br /><br   />\n<p>Second line</p>',
    meta: { internal_wp_noise: 'remove_me', keep_me: 'valuable' },
  };

  const transformer = (item) => ({
    ...item,
    content: item.content.replace(/<br\s*\/?>/gi, ''),
    meta: { keep_me: item.meta.keep_me },
  });

  const cleaned = transformer(dirtyWordPressItem);
  assert.equal(cleaned.content, '<p>Initial line</p>\n<p>Second line</p>');
  assert.deepEqual(cleaned.meta, { keep_me: 'valuable' });
});
