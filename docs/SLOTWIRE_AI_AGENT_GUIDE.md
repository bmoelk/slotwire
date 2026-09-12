# SlotWire AI Agent Guide & Operating Manual

> **Purpose**: This guide is written specifically for AI coding agents and developers building or bootstrapping websites using **SlotWire**, **Astro**, and headless CMS providers (WordPress, SlottD, Directus, SonicJS). It defines the architectural philosophy, strict operating directives, and practical patterns required to produce robust, zero-regression implementations.

---

## 1. Core Architectural Directives (Non-Negotiable)

### 1.1 Precision & Contract Integrity Directive (Fail Fast & Hard)
* **Zero Heuristic Fallbacks**: Never introduce silent fallback strings, dummy slugs, guesswork default templates, or silent bounces to `/` when a contract lookup fails.
* **Fail Immediately**: If a slot, collection, route template, document slug, or contract definition is missing, misnamed, unmapped, or invalid, **FAIL IMMEDIATELY** with an explicit, high-visibility error message.
* **Rationale**: Silent leniency masks integration bugs, creates "zombie" UI states, and destroys editorial trust.

### 1.2 SlotWire Scope & Data Client Boundary
* **SlotWire is strictly a Contract, Telemetry, and Visual In-Context Bridge — NEVER an ORM or generic data-query client.**
* **Where Data Fetching Belongs**: Data fetching and caching live natively in the frontend framework (e.g., Astro 5 Content Layer loaders, typed fetchers).
* **Push Back Firmly**: Do not introduce generic CMS data-querying, caching, or fetching wrappers into `@slotwire/core` or `@slotwire/astro`. SlotWire consumes provided data to enforce schema contracts and inject in-situ UI/telemetry, leaving data transport to native frontend tools.

### 1.3 Strict 1:1 Slot-to-Transformer Model
* **Never create 1:Many Transformer-to-Slot Orchestration**: Do not build complex machinery that attempts to split one transformer across multiple slots.
* **1:1 Pairings**: Every slot that requires data cleaning or projection has **exactly one succinct transformer** (`homepage_hero` $\leftrightarrow$ `heroTransformer`).
* **Shared Data Layer Deduplication**: When multiple slots draw from the same underlying CMS document (e.g. a monolithic homepage), the data fetching client deduplicates and caches the retrieval. Each slot transformer then succinctly plucks only the fields it requires.

### 1.4 Per-Slot Quick Edit Configuration & Deep Linking
* **Explicit Intent in Config**: Declare editing capabilities directly in `slotwire.config.ts` per slot:
  ```typescript
  slots: {
    homepage_hero: s.section({
      key: 'homepage_hero',
      collection: 'pages',
      ui: {
        quickEdit: false, // Disables in-situ drawer for complex composite slices
      },
    }),
  }
  ```
* **Always Maintain Deep Linking**: Disabling `quickEdit` must NEVER disable deep-linking. Editors clicking the in-situ badge on a complex slot are redirected directly to the native CMS editing screen (`buildAdminLink`, e.g. `/wp-admin/post.php?post=7&action=edit`).
* **The 80/20 Pragmatism Rule**: The Quick Edit Drawer is built for discrete 1:1 content entities (posts, single pages, singletons). Never risk corrupting a complex monolithic CMS layout by reverse-patching AST slices in an in-situ drawer. Let the native CMS editor handle complex layouts.

### 1.5 Dynamic Preview & Dual-Scope Caching
* When `slotwire_preview=true` is present in query parameters or cookies, all static/build caches must be bypassed (`cache: 'no-store'`) to dynamically render live draft/revision content from the CMS.
* **Build-Time Cache**: Short-lived TTL cache (30–60s) during `astro build` to prevent concurrent route workers from overwhelming low-resource origin droplets.
* **Dynamic SSR / Preview Cache (Per-Request Scope)**: A request-scoped cache that invalidates at the start of every new page render. During a single page render, all 5 slots share one fetch, but subsequent page loads immediately fetch fresh CMS data.
* **ISR Webhook Purge**: On-demand revalidation webhooks (`POST /api/slotwire/revalidate`) immediately flush cached entries upon content publish.

---

## 2. Composable Transformer Building Blocks (`tx.*`)

When migrating legacy CMS content (e.g., WordPress visual builders, ACF, complex Gutenberg trees), do not write one-off regex hacks. Use composable, declarative transformer blocks:

```typescript
import { s, type SlotTransformer } from '@slotwire/core';

export const tx = {
  /**
   * Strips or unwraps visual builder shortcodes (Divi [et_pb_*], Elementor, WPBakery)
   * while preserving semantic HTML tags (<p>, <h2>, <a>, <ul>).
   */
  cleanShortcodes: (options?: { unwrapOnly?: string[]; removeTags?: string[] }): SlotTransformer => {
    return (rawDoc) => {
      if (typeof rawDoc?.content === 'string') {
        rawDoc.content = rawDoc.content
          .replace(/\[\/?et_pb_[^\]]*\]/g, '')
          .replace(/\[\/?wpforms[^\]]*\]/g, '')
          .trim();
      }
      return rawDoc;
    };
  },

  /**
   * JQ/JSONPath-style lens extractor for nested fields
   */
  pluck: (path: string, fallback: any = null): SlotTransformer => {
    const keys = path.split('.');
    return (rawDoc) => {
      let curr = rawDoc;
      for (const k of keys) {
        if (curr == null) return fallback;
        curr = curr[k];
      }
      return curr ?? fallback;
    };
  },

  /**
   * Functional pipe for composing multiple transformers cleanly
   */
  compose: (...fns: SlotTransformer[]): SlotTransformer => {
    return (rawDoc, ctx) => fns.reduce((acc, fn) => fn(acc, ctx), rawDoc);
  },
};
```

---

## 3. The Triad of Responsibilities

When an AI agent executes a website conversion, tasks must be cleanly segregated:

| Domain | Scope | Typical Files / Tools | Solved By |
| :--- | :--- | :--- | :--- |
| **Domain A: Theme Customizations** | Astro components, Tailwind styles, layouts, responsive design, visual styling. | `src/components/*`, `src/layouts/*`, `src/styles/*` | Standard AI pair programming |
| **Domain B: Slot Architecture & Contracts** | `slotwire.config.ts`, Zod schemas, 1:1 slot transformers, Astro Content Layer loaders. | `slotwire.config.ts`, `src/content.config.ts`, `src/content/loaders/*` | AI Agent strictly following this Guide |
| **Domain C: SlotWire Platform Enhancements** | Core packages (`@slotwire/core`, `@slotwire/astro`), CMS companion plugins (`slotwire-headless.php`), CLI tools. | `packages/core/*`, `packages/astro/*`, `plugins/*` | Upstream codebase enhancements |

---

## 4. Standard `slotwire.config.ts` Pattern for Headless WordPress

```typescript
import { defineContract, s } from '@slotwire/core';
import { tx } from './src/lib/slotwire-transformers';

export default defineContract({
  cms: {
    provider: 'wordpress',
    apiUrl: process.env.CMS_API_URL || 'https://cms.example.com',
  },
  preview: {
    secret: process.env.SLOTWIRE_PREVIEW_SECRET,
  },
  sync: {
    webhookSecret: process.env.SLOTWIRE_PREVIEW_SECRET,
  },
  ui: {
    editor: 'html', // Default editor for WordPress HTML fragments (Pell)
  },
  slots: {
    // 1. Composite slice: Quick edit disabled, native WP deep linking active
    homepage_hero: s.section({
      key: 'homepage_hero',
      collection: 'pages',
      ui: {
        quickEdit: false, // 80/20 rule: edit full composite page in WP Admin
      },
      transform: tx.compose(
        tx.cleanShortcodes(),
        (doc) => ({
          title: "I'm Cady North",
          subtitle: "Author | Speaker | Investment Advisor",
          description: doc.content?.slice(0, 300) || '',
          ctaText: 'Chat with Cady',
          ctaUrl: '/book',
        })
      ),
    }),

    // 2. Discrete 1:1 entity: Quick edit enabled
    blog_post: s.section({
      key: 'blog_post',
      collection: 'posts',
      ui: {
        quickEdit: true, // Quick drawer active for standalone posts
        editor: 'html',
      },
      transform: tx.cleanShortcodes(),
    }),
  },
});
```

---

## 5. Summary Checklist for AI Agents
- [ ] Did you fail fast without heuristic fallbacks?
- [ ] Did you maintain the SlotWire boundary (no ORM or query client wrappers in SlotWire)?
- [ ] Are all slot-transformer pairs strictly 1:1?
- [ ] Are composite slices marked with `ui: { quickEdit: false }` while retaining deep links?
- [ ] Is dynamic preview bypassing all static caches (`cache: 'no-store'`)?
- [ ] Is the data client memoizing shared requests per page render?
