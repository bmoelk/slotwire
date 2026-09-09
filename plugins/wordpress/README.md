# SlotWire Headless Companion for WordPress (`plugins/wordpress`)

The official **WordPress companion plugin** for SlotWire and Astro. It provides a bridge between WordPress as a headless content management system and Astro as an ultra-fast frontend.

---

## ⚡ Core Features

1. **1-Click Live Preview Bridge**:
   - Rewrites standard WordPress "Preview" links to point directly to your Astro staging or dev site (`/posts/slug?slotwire_preview=true&token=...`).
   - Signs tokens with HMAC-SHA256 JWT payloads that match `@slotwire/core` and `astro-slotwire` `authGuard`.
   - Supports previewing unpublished drafts and private revisions.

2. **Clean, Flattened REST API (`/wp-json/slotwire/v1/*`)**:
   - Eliminates WordPress's awkward `{ rendered: "..." }` nesting.
   - Parses native Gutenberg blocks into an AST (`blocks`) for component-based rendering in Astro.
   - Integrates seamlessly with Advanced Custom Fields (ACF) and custom post meta.

3. **On-Demand ISR Revalidation Webhooks**:
   - Automatically dispatches signed HTTP POST requests to `POST /api/slotwire/revalidate` whenever content is published, updated, or trashed.
   - Dispatches asynchronously using WordPress's non-blocking HTTP client (`blocking => false`) to ensure publishing speed is never compromised.

4. **Slot Designation & In-Situ Editing**:
   - Adds a sidebar panel in both Gutenberg and Classic Editor to designate slot archetype mappings.
   - Compatible with SlotWire's in-situ Quick Edit Drawer using **Pell** (`ui: { editor: 'html' }`).

5. **Zero Runtime Dependencies**:
   - Written in 100% pure native PHP (PHP 7.4+ and PHP 8.x compatible).
   - Zero Composer packages required to install or operate.

---

## 📦 Packaging & Installation

### Building the Distribution Zip
From the monorepo root or inside `plugins/wordpress/`:

```bash
npm run build:zip
```

This compiles a clean, distribution-ready zip package in `plugins/wordpress/dist/slotwire-headless.zip`.

### Manual Installation in WordPress
1. In WordPress Admin, go to **Plugins > Add New > Upload Plugin**.
2. Select `dist/slotwire-headless.zip` and click **Install Now**.
3. Activate the plugin.
4. Go to **Settings > SlotWire Headless** to configure your Astro frontend URL and preview secret.

---

## ⚙️ Configuration Example (`slotwire.config.ts`)

```typescript
import { defineContract, s } from '@slotwire/core';

export default defineContract({
  cms: {
    provider: 'wordpress',
    apiUrl: 'https://cms.mysite.com',
  },
  preview: {
    secret: 'YOUR_PREVIEW_SECRET_FROM_WP_SETTINGS',
  },
  sync: {
    webhookSecret: 'YOUR_PREVIEW_SECRET_FROM_WP_SETTINGS',
  },
  ui: {
    editor: 'html', // Recommended for WordPress HTML fragments with Pell editor
  },
  slots: {
    hero: s.section({
      key: 'hero',
      collection: 'posts',
      defaultTitle: 'Hero Banner',
    }),
  },
});
```

---

## 🧪 Testing

The plugin test suite runs via Node.js (`node --test`) to verify:
1. **Cryptographic Parity**: Validates that tokens generated using the PHP algorithms can be successfully verified by `@slotwire/core` `verifyPreviewToken`.
2. **Payload Contract**: Validates that the REST output conforms to `slotwireLoader` schemas.
3. **Packaging**: Validates WordPress plugin manifest headers and zip packaging.

```bash
npm test
```
