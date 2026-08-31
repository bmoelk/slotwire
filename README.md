<div align="center">
  <img src="assets/slotwire-badge.svg" width="64" height="64" alt="SlotWire Logo" />
  <h1>SlotWire</h1>
  <p><strong>The 2-way schema contract, build-time validator, and visual in-situ inspector bridging modern web frameworks (Astro) with Headless CMSs.</strong></p>
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Astro](https://img.shields.io/badge/Astro-5.x%20%7C%207.x-FF5D01.svg)](https://astro.build)
[![SonicJS](https://img.shields.io/badge/SonicJS-3.x-00D8FF.svg)](https://sonicjs.com)


---

## The Problem: The "Headless Disconnect"

When building modern websites with Astro and a Headless CMS (SonicJS, Strapi, Sanity, Contentful), teams constantly hit three chronic issues:

1. **Blind CMS Setup & Content Modeling Fatigue**: Frontend developers build UI components with specific props/slots, while editors and AI agents face a blank canvas—often inventing fragmented, ad-hoc tables for every single page (`about_hero_v2`, `pottery_table`, `tech_bullets`).
2. **Silent Schema Drift & The "Headless Disconnect"**: When an editor renames, deletes, or omits a field in the CMS, the frontend silently breaks with zero in-situ visual feedback.
3. **No Visual In-Situ Feedback**: Content creators cannot see which visual slots on the website correspond to which fields in the CMS.

**SlotWire solves this through Lightweight Semantic Archetypes (`pages`, `page_sections`, `feature_cards`, `gallery`, `testimonials`) backed by live, validated 2-way contracts.**

*For the full industry analysis and research citations (Builder.io, Webiny, Brightspot, Deane Barker), see [docs/SEMANTIC_ARCHETYPES.md](docs/SEMANTIC_ARCHETYPES.md).*

---

## Features

* **Fluent Schema Contracts**: Declare typed visual slots and collections in a single `slotwire.config.ts` using Zod-backed builders.
* **Build-Time Verification (`slotwire:check`)**: Verify that 100% of your required visual slots are populated in the CMS before deploying.
* **Visual In-Situ Inspector (`<SlotWire />`)**: In development and preview modes, unpopulated CMS slots render distinct, helpful visual badges with direct links to edit the document in your CMS admin panel.
* **Automated CMS Scaffolding**: Sync contracts directly to your CMS database (e.g. Cloudflare D1 tables & collections).
* **Zero Runtime Overhead**: In production, SlotWire compiles away to lightweight native rendering with graceful fallbacks.

---

## Monorepo Architecture

```
slotwire/
├── packages/
│   ├── core/           # @slotwire/core: Schema contract builders, validator engine & drift detector
│   ├── astro/          # astro-slotwire: Astro integration, <SlotWire /> component & Dev Toolbar app
│   └── sonicjs/        # @slotwire/sonicjs: SonicJS plugin for automated D1 collection scaffolding
```

---

## Quick Start

### 1. Install Dependencies

```bash
# In your Astro project
npm install @slotwire/core astro-slotwire
```

### 2. Define Your Content Contract

Create `slotwire.config.ts` in your project root:

```typescript
import { defineContract, s } from '@slotwire/core';

export default defineContract({
  cms: {
    provider: 'sonicjs',
    apiUrl: 'https://cms.yourdomain.com',
  },
  slots: {
    // ── Single Section Slot ──────────────────────────────────────────────────
    hero: s.object({
      title: s.string().max(120),
      tagline: s.string().optional(),
      description: s.string().max(300),
      primaryCtaText: s.string(),
      primaryCtaUrl: s.url(),
    }),

    // ── Collection Slot ──────────────────────────────────────────────────────
    projects_matrix: s.collection('projects', {
      name: s.string().max(80),
      category: s.enum(['venture', 'opensource', 'rnd']),
      badgeText: s.string().optional(),
      description: s.string().max(500),
      destinationUrl: s.url().optional(),
      status: s.string(),
    }),
  },
});
```

### 3. Add to `astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';
import { slotwire } from 'astro-slotwire';
import slotwireConfig from './slotwire.config.js';

export default defineConfig({
  integrations: [
    slotwire({ config: slotwireConfig }),
  ],
});
```

### 4. Wrap Components with `<SlotWire />`

```astro
---
import SlotWire from "astro-slotwire/SlotWire.astro";
import { getProjects } from "@/lib/cms";

const projects = await getProjects();
---

<SlotWire slot="projects_matrix" data={projects} required={true}>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {projects.map((proj) => (
      <div class="card">
        <h3>{proj.name}</h3>
        <p>{proj.description}</p>
      </div>
    ))}
  </div>

  <!-- Optional fallback content for offline or unpopulated state -->
  <div slot="fallback">
    <p>Default projects fallback...</p>
  </div>
</SlotWire>
```

---

## Build-Time Validation CLI

Add the check command to your `package.json`:

```json
{
  "scripts": {
    "slotwire:check": "tsx scripts/validate-slotwire.ts"
  }
}
```

Running `npm run slotwire:check` outputs:

```
======================================================
⚡ SlotWire Contract & Schema Completeness Validator
======================================================
🌐 Target CMS: https://cms.brainendeavor.com

✅ Slot: 'hero' [object]
   Fields populated: 7/7
   CMS documents: 1

✅ Slot: 'projects_matrix' [collection]
   Fields populated: 7/8
   CMS documents: 4

------------------------------------------------------
Summary: 2/2 Slots Fully Covered
Status: ✅ ALL CONTRACTS SATISFIED
======================================================
```

---

## Roadmap

- [x] `@slotwire/core` Contract Builder & Zod Schema Engine
- [x] `@slotwire/sonicjs` Cloudflare D1 Scaffolding Plugin
- [x] `astro-slotwire` Integration & `<SlotWire />` Visual Inspector
- [ ] **Astro Content Layer Native Loaders** (`slotwireLoader()`)
- [ ] **Pluggable CMS Adapters** (Sanity, Strapi, Contentful, Keystatic, Ghost)
- [ ] **Astro Dev Toolbar Interactive App** (Highlight & 1-click deep link to CMS documents)

---

## License

MIT © [BrainEndeavor](https://brainendeavor.com)
