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

* **Design-First Visual Archetypes**: Distill page layouts (`bento`, `narrative`, `standard`) and slot hierarchies directly from UI components, with automatic cascade and shared reference resolution.
* **Navigation Contracts (`s.navigation`)**: Formally model and manage site menus (Header, Dropdowns, Footer) in CMS collections and automatically link newly created pages.
* **Visual In-Situ Pre-Create Cloner**: 1-click clone existing page layouts or distilled archetypes into live CMS draft records directly from the preview workbench.
* **Fluent Schema Contracts**: Declare typed visual slots, singletons, and collections in a single `slotwire.config.ts` using Zod-backed builders.
* **Build-Time Verification (`@slotwire/cli scan`)**: Verify that 100% of required visual slots are populated in the CMS before deploying.
* **Universal Multi-CMS Adapters**: Out-of-the-box deep-linking support for SonicJS, Strapi, Payload CMS, Directus, Keystatic, and Decap CMS.
* **Zero Runtime Overhead**: In production, SlotWire ships 0 KB of client JavaScript with inert semantic `data-slotwire-*` tags.

---

## Monorepo Architecture

```
slotwire/
├── packages/
│   ├── core/           # @slotwire/core: Schema contracts, archetypes, navigation, blueprint generator & validators
│   ├── astro/          # astro-slotwire: Astro integration, <SlotWire />, Ghost slots, HUD & Pre-Create Cloner
│   ├── sonicjs/        # @slotwire/sonicjs: SonicJS plugin for automated D1 collections & draft scaffolding
│   └── cli/            # @slotwire/cli: Terminal auditor, gap matrix scanner, and pre-deploy validation
```

---

## Quick Start

### 1. Install Dependencies

```bash
# In your Astro project
npm install @slotwire/core astro-slotwire
```

### 2. Define Your Content Contract & Archetypes

Create `slotwire.config.ts` in your project root:

```typescript
import { defineContract, s } from '@slotwire/core';

export default defineContract({
  cms: {
    provider: 'sonicjs',
    apiUrl: 'https://cms.yourdomain.com',
  },

  // ── Navigation Architecture Contract ───────────────────────────────────────
  navigation: s.navigation({
    collection: 'site_navigation',
    menus: ['header_main', 'header_dropdown', 'footer_primary', 'footer_legal'],
  }),

  // ── Design-First Layout Archetypes ─────────────────────────────────────────
  archetypes: {
    bento: s.page({
      template: 'bento',
      description: 'Bento Grid marketing layout with hero and feature cards',
      slots: {
        hero: s.section({ key: 'hero', strategy: 'cascade' }),
        features: s.section({
          key: 'features',
          strategy: 'cascade',
          children: s.collection('feature_cards', { defaultCount: 4 }),
        }),
        social_proof: s.singleton('endorsements', { strategy: 'reference' }),
      },
    }),
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

<SlotWire slot="projects_matrix" archetype="cards" collection="projects" data={projects} required={true}>
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

Run `@slotwire/cli scan` to verify schema completeness across all pages before deploying:

```bash
npx slotwire scan
```

---

## Roadmap

- [x] `@slotwire/core` Contract Builder & Zod Schema Engine
- [x] **Design-First Page Creation & Template Archetypes** (`bento`, `narrative`, `standard`)
- [x] **Navigation Contracts & Auto-Menu Placement** (`s.navigation`)
- [x] **Visual In-Situ Pre-Create Cloner** (1-click draft scaffolding from preview)
- [x] **Universal Pluggable CMS Adapters** (SonicJS, Strapi, Payload, Directus, Keystatic, Decap)
- [x] **Zero-JS Semantic Production Tagging & Ticketing Bridge**
- [x] `@slotwire/sonicjs` Cloudflare D1 Scaffolding Plugin
- [x] `astro-slotwire` Integration, Ghost Slots & Interactive Checklist HUD
- [ ] **Astro Content Layer Native Loaders** (`slotwireLoader()`)
- [ ] **Astro Dev Toolbar Interactive App Extension**

---

## License

MIT © [BrainEndeavor](https://brainendeavor.com)
