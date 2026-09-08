import { test } from 'node:test';
import assert from 'node:assert/strict';
import { s, defineContract, validateContract } from '../dist/index.js';

test('s.media and s.image: creates first-class media schema with options', () => {
  const mediaField = s.media({ checkExists: true, allowedExtensions: ['jpg', 'png'] }).build();
  assert.equal(mediaField.type, 'media');
  assert.equal(mediaField.mediaOptions?.checkExists, true);
  assert.deepEqual(mediaField.mediaOptions?.allowedExtensions, ['jpg', 'png']);

  const imageField = s.image({ recommendation: 'Upload to R2' }).build();
  assert.equal(imageField.type, 'media');
  assert.ok(imageField.mediaOptions?.allowedExtensions?.includes('webp'));
  assert.equal(imageField.mediaOptions?.recommendation, 'Upload to R2');
});

test('validateContract: catches missing media and produces aggregated recommendations', async () => {
  const config = defineContract({
    cms: {
      provider: 'slottd',
      apiUrl: 'https://cms.test.local',
    },
    slots: {
      gallery: s.collection('gallery', {
        title: s.string(),
        imageUrl: s.image({ recommendation: 'Upload pottery image to R2' }),
      }),
    },
  });

  // Mock fetchFn:
  // - /items/gallery returns 2 items: 1 valid image, 1 missing image
  // - /assets/pottery-1.jpg returns 200
  // - /assets/pottery-2.jpg returns 404
  const mockFetch = async (url, opts) => {
    const urlStr = String(url);
    if (urlStr.includes('/items/gallery')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { id: '1', slug: 'pottery-1', title: 'Pottery 1', imageUrl: '/media/pottery-1.jpg' },
            { id: '2', slug: 'pottery-2', title: 'Pottery 2', imageUrl: '/media/pottery-2.jpg' },
          ],
        }),
      };
    }
    if (urlStr.includes('/assets/pottery-1.jpg')) {
      return { ok: true, status: 200 };
    }
    if (urlStr.includes('/assets/pottery-2.jpg') || urlStr.includes('/files/pottery-2.jpg')) {
      return { ok: false, status: 404 };
    }
    return { ok: false, status: 404 };
  };

  const report = await validateContract(config, mockFetch);

  assert.equal(report.totalSlots, 1);
  assert.equal(report.missingMedia.length, 1);
  assert.equal(report.missingMedia[0].field, 'imageUrl');
  assert.equal(report.missingMedia[0].mediaPath, '/media/pottery-2.jpg');
  assert.equal(report.missingMedia[0].recommendation, 'Upload pottery image to R2');
  assert.ok(report.recommendations.includes('Upload pottery image to R2'));
  assert.equal(report.isFullyCovered, false);
});
