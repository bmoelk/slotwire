# Page Templates & The Universal "New Page" Workflow Specification

> **Core Thesis**: In Astro, blog pages already have a solved, elegant "new page" creation model: write a markdown file or create a CMS record, and Astro's dynamic route (`src/pages/blog/[...slug].astro`) automatically renders it through a dedicated layout. 
>
> SlotWire generalizes this exact mechanism across the **entire website**. By extracting reusable **Page Templates** from Astro layouts and pairing them with **Dynamic Route Dispatching** and **Atomic Archetype Scaffolding**, editors get the seamless creation experience of Webflow or Squarespace (*"pick a template, get a fully populated page"*) on top of Astro's ultra-fast, zero-JS edge architecture.

---

## 1. Architectural Overview & System Flow

```mermaid
flowchart TD
    subgraph 1_Astro_Design_Phase ["1. Template Extraction (Astro)"]
        Theme["Astro Website / Theme"]
        T_Blog["BlogTemplate.astro"]
        T_Service["ServiceDetailTemplate.astro"]
        T_Bento["BentoLandingTemplate.astro"]
        T_Legal["StandardLegalTemplate.astro"]
        Theme --> T_Blog & T_Service & T_Bento & T_Legal
    end

    subgraph 2_Contract_Phase ["2. Contract Declaration (slotwire.config.ts)"]
        Contract["slotwire.config.ts"]
        NavContract["s.navigation (Header, Footer)"]
        Archetypes["s.page({ template: 'bento', slots: { ... } })"]
        Contract --> NavContract & Archetypes
    end

    subgraph 3_Creation_UX ["3. Editorial "New Page" Trigger"]
        Editor["Content Editor"]
        Modal["+ New Page Modal\n1. Select Template (Bento)\n2. Enter Title & Slug ('solutions')\n3. [x] Add to Main Nav"]
        Editor --> Modal
    end

    subgraph 4_Atomic_Scaffold ["4. SlottD Atomic Scaffolding (/ext/archetype/scaffold)"]
        D1_Page["Insert `pages` record"]
        D1_Sections["Auto-insert `page_sections` (hero, features, cta)"]
        D1_Cards["Auto-insert default `feature_cards` (4 starter cards)"]
        D1_Nav["Auto-insert `site_navigation` link"]
        Modal --> D1_Page
        D1_Page --> D1_Sections --> D1_Cards --> D1_Nav
    end

    subgraph 5_Live_Render ["5. Dynamic Preview & In-Situ Editing"]
        AstroRoute["src/pages/[...slug].astro\n(Template Switcher)"]
        Preview["Instant Live Preview\n/solutions?slotwire_preview=true"]
        QuickEdit["In-Situ 80/20 Quick Drawer\n(Instant copy tweaking)"]
        D1_Nav --> AstroRoute --> Preview --> QuickEdit
    end
```

---

## 2. Phase 1: Template Extraction & Discovery (The Integration Playbook)

When integrating SlotWire into an existing Astro project or theme, developers do not create ad-hoc pages. Instead, they identify and extract the site's canonical **Page Templates**:

```
src/
├── layouts/
│   └── BaseLayout.astro                # Global HTML, Head, Nav & Footer chrome
├── components/
│   └── templates/                      # Canonical Page Templates
│       ├── BlogArticleTemplate.astro   # Homogeneous: Title, Date, Markdown/RichText Body
│       ├── ServiceDetailTemplate.astro # Composite: Service Hero, Specs, Gallery, CTA
│       ├── BentoLandingTemplate.astro  # Composite: Hero, Bento Grid, Cards, Testimonials
│       └── StandardLegalTemplate.astro # Homogeneous: Header, Sidebar TOC, Legal Markdown
└── pages/
    └── [...slug].astro                 # Universal Dynamic Route Gateway
```

### Template Classification:

1. **Homogeneous Templates (Single-Document Content)**:
   * Examples: `BlogArticleTemplate`, `StandardLegalTemplate`.
   * **Characteristics**: The page is driven by a single document containing text, date, author, and markdown body. No complex child relational collections required.
   * **Scaffolding Needs**: Inserts a single record into the collection.

2. **Heterogeneous / Composite Templates (Multi-Slot Archetypes)**:
   * Examples: `BentoLandingTemplate`, `ServiceDetailTemplate`.
   * **Characteristics**: The page layout is composed of distinct visual slots (`hero` section, `feature_cards` collection, `gallery` array, `testimonials` singleton).
   * **Scaffolding Needs**: Requires atomic multi-table scaffolding so the page does not render empty voids on creation.

---

## 3. Phase 2: The Universal Dynamic Route Gateway (`src/pages/[...slug].astro`)

Instead of limiting dynamic routes to `/blog/[...slug].astro`, the site implements a single, high-performance root gateway that handles routing for all CMS-driven pages:

```astro
---
// src/pages/[...slug].astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import BlogArticleTemplate from '@/components/templates/BlogArticleTemplate.astro';
import ServiceDetailTemplate from '@/components/templates/ServiceDetailTemplate.astro';
import BentoLandingTemplate from '@/components/templates/BentoLandingTemplate.astro';
import StandardLegalTemplate from '@/components/templates/StandardLegalTemplate.astro';
import { getCollection, getEntry } from 'astro:content';

// 1. Static Build Generation (SSG)
export async function getStaticPaths() {
  const pages = await getCollection('pages');
  return pages.map((page) => ({
    params: { slug: page.slug === 'home' ? undefined : page.slug },
    props: { page },
  }));
}

// 2. Dynamic Route Resolution (SSR & Live Preview)
const slugParam = Astro.params.slug;
const pageSlug = (!slugParam || slugParam === '/') ? 'home' : slugParam.replace(/^\/+|\/+$/g, '');

let page = Astro.props.page;
if (!page) {
  page = await getEntry('pages', pageSlug);
}

// 3. Fallback / 404
if (!page) {
  return Astro.redirect('/404');
}

// 4. Template Registry Switcher
const templateRegistry: Record<string, any> = {
  blog: BlogArticleTemplate,
  service: ServiceDetailTemplate,
  bento: BentoLandingTemplate,
  legal: StandardLegalTemplate,
};

const templateKey = page.data.template || 'standard';
const ActiveTemplate = templateRegistry[templateKey] || StandardLegalTemplate;
---

<BaseLayout 
  title={page.data.title} 
  description={page.data.description}
  pageSlug={pageSlug}
>
  <ActiveTemplate page={page} />
</BaseLayout>
```

---

## 4. Phase 3: Contract Declaration (`slotwire.config.ts`)

The contract formalizes what templates exist, what slots they require, and what starter defaults should be scaffolded when an author creates a new page:

```typescript
import { defineContract, s } from '@slotwire/core';

export default defineContract({
  cms: {
    provider: 'slottd',
    apiUrl: 'https://cms.yourdomain.com',
  },

  // ── Navigation Architecture Contract ───────────────────────────────────────
  navigation: s.navigation({
    collection: 'site_navigation',
    menus: ['header_main', 'footer_primary', 'footer_legal'],
  }),

  // ── Page Layout Archetypes (Template Specifications) ────────────────────────
  archetypes: {
    // 1. Bento Marketing Template
    bento: s.page({
      template: 'bento',
      label: 'Bento Landing Page',
      description: 'Feature-heavy marketing layout with hero, grid cards, and social proof',
      slots: {
        hero: s.section({
          key: 'hero',
          defaultTitle: 'Headline That Captures Attention',
          defaultDescription: 'Explain your core value proposition in two clear sentences.',
          defaultPrimaryCtaText: 'Get Started Today',
          defaultPrimaryCtaUrl: '/contact',
        }),
        features: s.section({
          key: 'features',
          defaultTitle: 'Platform Capabilities',
          children: s.collection('feature_cards', {
            defaultCount: 4,
            defaults: [
              { title: 'Sub-second Latency', summary: 'Global edge distribution via Cloudflare Workers.' },
              { title: 'Contract Safety', summary: 'Build-time schema validation with zero runtime overhead.' },
              { title: 'In-Situ Authoring', summary: 'Click and edit directly from the live preview.' },
              { title: 'Git Sync', summary: 'Automatic two-way sync between edge D1 and Git history.' },
            ],
          }),
        }),
        social_proof: s.singleton('testimonials', {
          strategy: 'reference',
          defaultTitle: 'Trusted by modern engineering teams.',
        }),
      },
    }),

    // 2. Service Detail Template
    service: s.page({
      template: 'service',
      label: 'Service / Solution Detail',
      description: 'Technical offering page with deliverables, architecture specs, and CTA',
      slots: {
        hero: s.section({ key: 'hero', defaultTitle: 'Specialized Engineering Service' }),
        deliverables: s.section({
          key: 'deliverables',
          children: s.collection('feature_cards', { defaultCount: 3 }),
        }),
      },
    }),

    // 3. Blog Article Template
    blog: s.page({
      template: 'blog',
      label: 'Editorial Blog Post',
      description: 'Standard narrative article with hero cover, metadata, and markdown body',
      slots: {
        content: s.object({
          body: s.string().default('Write your article introduction here...'),
        }),
      },
    }),
  },
});
```

---

## 5. Phase 4: The Atomic Scaffolding Engine (`POST /ext/archetype/scaffold`)

To eliminate "Blank Page Syndrome" and "Foreign Key Fatigue", SlottD implements a specialized atomic scaffolding endpoint. When an editor creates a new page, SlottD creates all necessary rows inside a **single SQLite transaction**:

### Request Payload:
```json
POST /ext/archetype/scaffold
Content-Type: application/json

{
  "template": "bento",
  "title": "Cloud Architecture Consulting",
  "slug": "cloud-consulting",
  "addToNav": true,
  "navMenu": "header_main"
}
```

### Transaction Execution (SlottD Worker):
```sql
-- 1. Insert Master Page Record
INSERT INTO documents (id, collection, slug, title, status, data, created_at, updated_at)
VALUES (
  'doc_page_cloud_consulting', 
  'pages', 
  'cloud-consulting', 
  'Cloud Architecture Consulting', 
  'draft', 
  json_object('template', 'bento', 'title', 'Cloud Architecture Consulting'),
  unixepoch(),
  unixepoch()
);

-- 2. Insert Default Section Slots
INSERT INTO documents (id, collection, slug, title, status, data, created_at, updated_at)
VALUES (
  'doc_sec_cloud_consulting_hero',
  'page_sections',
  'cloud-consulting-hero',
  'Cloud Consulting Hero',
  'draft',
  json_object(
    'pageSlug', 'cloud-consulting',
    'sectionKey', 'hero',
    'title', 'Headline That Captures Attention',
    'description', 'Explain your core value proposition in two clear sentences.',
    'primaryCtaText', 'Get Started Today',
    'primaryCtaUrl', '/contact'
  ),
  unixepoch(),
  unixepoch()
);

-- 3. Insert Default Child Cards (Loop over defaults in archetype)
INSERT INTO documents (id, collection, slug, title, status, data, created_at, updated_at)
VALUES 
  ('doc_card_1', 'feature_cards', 'cloud-consulting-card-1', 'Card 1', 'draft', json_object('pageSlug', 'cloud-consulting', 'sectionKey', 'features', 'title', 'Sub-second Latency'), unixepoch(), unixepoch()),
  ('doc_card_2', 'feature_cards', 'cloud-consulting-card-2', 'Card 2', 'draft', json_object('pageSlug', 'cloud-consulting', 'sectionKey', 'features', 'title', 'Contract Safety'), unixepoch(), unixepoch());

-- 4. Insert Navigation Entry (If requested)
INSERT INTO documents (id, collection, slug, title, status, data, created_at, updated_at)
VALUES (
  'doc_nav_cloud_consulting',
  'site_navigation',
  'nav-cloud-consulting',
  'Cloud Architecture Consulting',
  'draft',
  json_object(
    'title', 'Cloud Consulting',
    'link', '/cloud-consulting',
    'menuKey', 'header_main',
    'order', 99
  ),
  unixepoch(),
  unixepoch()
);
```

### Result:
* Execution time: **`< 25ms`** on Cloudflare D1.
* The API returns:
  ```json
  {
    "status": "ok",
    "slug": "cloud-consulting",
    "previewUrl": "https://preview.domain.com/cloud-consulting?slotwire_preview=true"
  }
  ```

---

## 6. Phase 5: The Editorial Experience (Authoring UX)

The entire flow provides immediate gratification with zero friction:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TRIGGER                                                  │
│    Editor clicks "+ New Page" in SlottD Studio OR in the    │
│    in-situ `<AssistBubble />` floating HUD on staging.      │
├─────────────────────────────────────────────────────────────┤
│ 2. MODAL SELECTION                                          │
│    • Template: [ Bento Landing Page ▾ ]                     │
│    • Title: "Enterprise Migration Services"                 │
│    • Slug:  /services/enterprise-migration                  │
│    • [x] Link in Main Header Menu                           │
│    [ Create Page (Instant) ]                                │
├─────────────────────────────────────────────────────────────┤
│ 3. INSTANT REDIRECT                                         │
│    The browser immediately opens:                           │
│    `/services/enterprise-migration?slotwire_preview=true`   │
├─────────────────────────────────────────────────────────────┤
│ 4. ZERO BLANK SCREENS                                       │
│    The page renders with real typography, starter layout,   │
│    hero, cards, and navigation link in place.               │
├─────────────────────────────────────────────────────────────┤
│ 5. 80/20 IN-SITU CUSTOMIZATION                              │
│    Editor clicks [⚡ Quick Edit] on the hero, tweaks the   │
│    starter headline, hits Enter -> D1 updates in 15ms.      │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Engineering Plan

### Step 1: `@slotwire/core` Contract Updates
* Add `s.page({ template, slots, defaultTitle, defaultDescription })` archetype helper.
* Expose `getArchetype(templateKey)` helper so adapters and endpoints can inspect default slot structures.

### Step 2: `slottD` Scaffolding Endpoint
* Implement `POST /ext/archetype/scaffold` in `packages/server/src/routes/ext.ts`.
* Execute the multi-row insert inside a single Kysely / D1 SQLite transaction (`db.transaction()`).
* Handle automatic slug collision avoidance (e.g. appending `-1` if slug exists).

### Step 3: `astro-slotwire` Integration Helpers
* Provide standard reference template switcher snippet for `src/pages/[...slug].astro`.
* Add "+ New Page" trigger directly to the floating `<AssistBubble />` action drawer in staging.

### Step 4: Verification & Automated Tests
* Test atomic rollback: If card generation fails, ensure the master `pages` row is not orphaned.
* Test dynamic preview: Ensure newly scaffolded D1 drafts immediately render on `[...slug].astro` when `slotwire_preview=true` is present.
