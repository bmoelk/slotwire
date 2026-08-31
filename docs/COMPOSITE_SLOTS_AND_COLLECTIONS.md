# Composite Slots, Collections & Cardinality in Headless CMS Architecture

This document formalizes how **SlotWire** aligns with **Astro's Content Layer**, models cardinality relationships, tracks referential integrity, and bridges frontend UI layouts to headless CMS content models.

---

## 1. How Astro Catalogs Content & Where SlotWire Fits

To understand how SlotWire operates, it is essential to understand **Astro's native data architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ASTRO CONTENT LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Data Store Cache: Indexed strictly by `collection` and `id` (or `slug`). │
│ 2. Typed Loaders: Fetch remote data (API/SQL/D1) and populate the store.    │
│ 3. References (`reference('collection')`): Link documents across models.     │
│ 4. Pages / Components: Load entries via `getEntry()` and `getEntries()`.    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ passes live data
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SLOTWIRE TELEMETRY & HUD                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Intercepts resolved Astro data via `<SlotWire data={...}>`.              │
│ 2. Extracts real CMS document IDs (`item.id`) without parsing or guessing.   │
│ 3. Enforces contract schema validation and catches orphaned references.     │
│ 4. Injects in-situ UI badges and deep links to the headless CMS.             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Principles of the Astro + SlotWire Alignment:
1. **Astro Owns Data Fetching & Routing**: Astro loaders fetch data from the CMS, validate types with Zod, and render HTML pages.
2. **SlotWire Owns Telemetry, Contracts & CMS Bridging**: SlotWire inspects what Astro passes to components, detects whether data is live CMS content or fallback mock data, verifies references, and provides 1-click in-context deep links into the CMS editor.
3. **No Guesswork / Heuristics**: SlotWire uses the canonical `id` and `collection` that Astro's Content Layer has already resolved.

---

## 2. The Core Challenge: Cardinality Mismatch

In frontend design, a single UI component often renders a composite array of items:
- A **Services Bento Grid** (1 layout slot) rendering 3 distinct service cards.
- A **Projects Matrix** (1 layout slot) rendering 4 distinct venture cards.
- A **Testimonials Carousel** (1 layout slot) rendering 5 client quotes.

From a CMS perspective, however, these cards are **individual database documents**, each with their own lifecycle, draft status, and unique ID (`srv-technical-consulting`, `srv-product-collaboration`, `srv-ai-strategy`).

```
Frontend UI Container (1 Slot)
  └── <SlotWire slot="home_services" archetype="cards" collection="services" data={servicesList}>
        ├── Card 1: srv-technical-consulting (Astro Entry ID)
        ├── Card 2: srv-product-collaboration (Astro Entry ID)
        └── Card 3: srv-ai-strategy (Astro Entry ID)
```

When an editor hovers over this slot in preview mode, where should the CMS link go? How should the relationships be maintained?

---

## 3. The 3 Architectural Modeling Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CMS CONTENT MODELING STRATEGIES                       │
├────────────────────────────────┬────────────────────────────┬───────────────┤
│ Strategy 1: Container / Rel.   │ Strategy 2: Filtered Shared│ Strategy 3:   │
│    (Preferred for Layouts)     │    (Secondary / Reusable)  │    Explicit   │
├────────────────────────────────┼────────────────────────────┼───────────────┤
│ Parent section document orders │ Shared pool of cards       │ Dedicated CMS │
│ child items via references     │ filtered by composite keys │ collection per│
│ (Repeater / JSON / Slug list)  │ (pageSlug + sectionKey)    │ feature model │
└────────────────────────────────┴────────────────────────────┴───────────────┘
```

---

### Strategy 1 (Primary / Preferred): Hierarchical & Container Models

The parent section document (`section-home-services` in `page_sections`) acts as the single source of truth for the entire composite layout.

#### Implementation Patterns for Least-Common-Denominator CMSs:

When a headless CMS lacks native visual component blocks or nested repeaters, we implement one of three standard patterns:

#### Pattern A: Embedded JSON / Array Field
The parent section record contains an embedded `cards` or `items` JSON column:
```json
{
  "id": "section-home-services",
  "title": "Our Services",
  "badgeText": "Capabilities & Expertise",
  "cards": [
    { "title": "Technical Consulting", "summary": "..." },
    { "title": "Product Development Collaboration", "summary": "..." },
    { "title": "Pragmatic AI Strategy", "summary": "..." }
  ]
}
```
* **Deep Link Target**: Direct edit on the parent section (`/admin/content/section-home-services/edit`).
* **Editor Experience**: Single edit form. Updating the header and all cards happens in one screen.

#### Pattern B: Relational Slugs & Native Astro References
The parent section maintains an ordered list of child document IDs or slugs (e.g. `card_slugs: ["srv-consulting", "srv-collab", "srv-ai"]`):
```typescript
// Astro Content Layer Schema (src/content.config.ts)
const page_sections = defineCollection({
  loader: sonicJsLoader({ collection: 'page_sections' }),
  schema: z.object({
    title: z.string(),
    badgeText: z.string().optional(),
    card_slugs: z.array(reference('services')), // Astro native reference!
  }),
});
```

* **How Astro Resolves This**: Astro uses `getEntries(section.data.card_slugs)` to fetch the child documents with build-time type safety.
* **Managing Orphaned References**:
  * *The Risk*: If an editor renames or deletes `srv-consulting` in the CMS, the parent section still references the old slug.
  * *SlotWire Orphan Detection Engine*: SlotWire scans reference fields during build and runtime. If a referenced ID is missing from the CMS, SlotWire:
    1. Logs a build-time contract violation:
       `⚠️ [SlotWire Contract] Section 'section-home-services' references missing document 'srv-consulting' in collection 'services'.`
    2. In dev/preview mode, renders the valid cards and injects an **Orphaned Reference Ghost Chip** on the missing card: `[⚠️ Orphaned: srv-consulting (Create or Re-link ↗)]`.

#### Pattern C: SlotWire In-Situ Composite Gateway
SlotWire inspects the resolved child entries passed to `<SlotWire data={servicesList}>` and turns the in-situ hover UI into a **Multi-Target In-Context Gateway**:
```
┌───────────────────────────────────────────────────────────┐
│ ⚡ SlotWire: home_services (Composite Container)          │
├───────────────────────────────────────────────────────────┤
│ 📝 Section Header ────> [Edit: section-home-services ↗]   │
│ 📝 Card 1 (Consulting)─> [Edit: srv-technical-consulting ↗]│
│ 📝 Card 2 (Collab) ────> [Edit: srv-product-collab ↗]      │
│ 📝 Card 3 (AI Strategy)─> [Edit: srv-ai-strategy ↗]       │
│ ──────────────────────────────────────────────────────────│
│ ➕ Add New Card        [+ Create in Services ↗]           │
│ 📋 View All Services   [Open Services Table ↗]            │
└───────────────────────────────────────────────────────────┘
```
* **How SlotWire Knows the IDs**: SlotWire does **not** guess or parse URLs. Because Astro passed `servicesList` (an array of entries containing `id`), SlotWire simply reads `item.id` from each element and builds exact, direct edit links for every card.

---

### Strategy 2 (Secondary / Reusable): Filtered Shared Archetypes

Consolidate repeated card patterns into a universal `feature_cards` archetype and partition by composite keys (`pageSlug` + `sectionKey`):
- `feature_cards` (`pageSlug="home"`, `sectionKey="services"`)
- `feature_cards` (`pageSlug="about"`, `sectionKey="philosophy"`)
- `feature_cards` (`pageSlug="technology"`, `sectionKey="stack"`)

#### How SlotWire Eliminates the Tag/Key Management Burden:
1. **Auto-Injected Query Parameters on Create**:
   When clicking `+ Add Card`, SlotWire generates:
   ```
   /admin/content/new?collection=feature_cards&pageSlug=home&sectionKey=services
   ```
   The editor never manually types or remembers `pageSlug` or `sectionKey`.
2. **Context-Aware List Filtering**:
   SlotWire generates list deep links with query parameters (`/admin/content?model=feature_cards&search=home:services` or `&filter[sectionKey]=services`), scoping the CMS view directly to that section.
3. **In-Situ Gateway Bypass**:
   The editor never needs to browse the 500-item global CMS table, because SlotWire's in-situ hover UI provides direct 1-click links to the cards currently on screen.

---

### Strategy 3: Explicit Discrete Collections (Domain Entities)

Model distinct business domain entities as dedicated CMS collections:
- `services` (contains strictly service offerings)
- `projects` (contains strictly venture & open-source projects)
- `endorsements` / `testimonials` (contains client reviews & quotes)

* **Deep Link Target**: `/admin/content?model=services`
* **Editor Experience**: Dedicated model in the CMS sidebar. Opening the table shows **only** those records.

---

## 4. Universal Logical Actions vs. CMS Adapters

A critical distinction in SlotWire is the separation between **Universal Logical Actions** and **CMS-Specific Adapters**:

```
┌─────────────────────────────────────────────────────────┐
│              UNIVERSAL LOGICAL ACTION CONTRACT          │
├─────────────────────────────────────────────────────────┤
│ • Action: `edit` (Single Document) -> requires `id`     │
│ • Action: `list` (Collection / Model) -> requires `model│
│ • Action: `create` (New Document) -> requires `model`   │
└────────────────────────────┬────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│     SonicJS Adapter   │         │     Strapi Adapter    │
├───────────────────────┤         ├───────────────────────┤
│ `/admin/content/:id/  │         │ `/admin/content-      │
│  edit`                │         │  manager/collection   │
│ `/admin/content?model │         │  Type/api:::model/:id`│
│  =:model`             │         │ `/admin/content-      │
│ `/admin/content/new?  │         │  manager/collection   │
│  collection=:model`   │         │  Type/api:::model`    │
└───────────────────────┘         └───────────────────────┘
```

- **SlotWire Core & Astro Components**: Deal strictly with universal intent (`action: 'edit' | 'list' | 'create'`, `collection`, `documentId`, `archetype`).
- **CMS Adapters (`SlotWireCmsAdapter`)**: Pure translation modules that turn that universal intent into provider-specific administrative URLs.

---

## 5. Summary & Decision Matrix

| Requirement | Recommended Approach | How Astro Handles It | How SlotWire Bridges It |
| :--- | :--- | :--- | :--- |
| **Section Layout with 2–4 Cards** | **Strategy 1 (Container + Slugs / JSON)** | `getEntries(section.data.card_slugs)` | In-situ Gateway with direct edit links for each card + header |
| **Generic Recurring UI Grids** | **Strategy 2 (Shared `feature_cards`)** | `getCollection('feature_cards', filterFn)` | Auto-injects composite query parameters on creation & list views |
| **Independent Business Entities** | **Strategy 3 (Explicit Collections)** | `getCollection('services')` | Direct links to filtered model list view (`?model=services`) |
| **Orphaned Reference Safety** | **Referential Integrity Validation** | Zod schema `reference()` validation | Scans references and renders Orphan Ghost chips in preview mode |
