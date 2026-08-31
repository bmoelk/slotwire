# Composite Slots, Collections & Cardinality in Headless CMS Architecture

This document formalizes how **SlotWire** models and bridges the cardinality relationship between frontend UI layouts and headless CMS content models.

---

## 1. The Core Challenge: Cardinality Mismatch

In modern web development, frontend page templates frequently declare a single container slot that renders an array of distinct items:
- A **Services Bento Grid** rendering 3 service cards.
- A **Projects Matrix** rendering 4 active ventures.
- A **Ceramic Gallery** rendering 6 artwork photos.
- A **Testimonials Slider** rendering 3 customer quotes.

From a CMS perspective, however, these cards are **individual database documents**, each with their own lifecycle, draft state, slug, and unique ID (`srv-technical-consulting`, `srv-product-collaboration`, `srv-ai-strategy`).

```
Frontend UI Container (1 Slot)
  └── <SlotWire slot="home_services" archetype="cards" collection="services">
        ├── Card 1: srv-technical-consulting (Document ID)
        ├── Card 2: srv-product-collaboration (Document ID)
        └── Card 3: srv-ai-strategy (Document ID)
```

When an editor hovers over the parent container slot in preview mode or inspects the HUD drawer, where should the deep link route?

---

## 2. The 3 CMS Modeling Approaches

### Approach 1: Explicit Discrete Collections (Model-per-Feature)
Model each distinct business domain feature as its own dedicated CMS collection:
- `services` (contains strictly the 3 service records)
- `projects` (contains strictly the 4 portfolio projects)
- `pottery_gallery` (contains strictly the pottery pieces)

* **Deep Link Target**: `/admin/content?model=services`
* **Editor Experience**: The editor opens the CMS and sees **only** the 3 service cards. Zero clutter or cross-contamination from other sections.
* **Trade-offs**: 
  - ✅ Clean 1:1 mental model in the CMS admin sidebar.
  - ✅ Custom fields and strict validation tailored per feature.
  - ⚠️ More collection schemas to manage across the codebase.

---

### Approach 2: Filtered Shared Archetypes (Composite Identity Filtering)
Consolidate repeated card patterns into a universal `feature_cards` archetype and partition by composite keys (`pageSlug` + `sectionKey`):
- `feature_cards` (`pageSlug="home"`, `sectionKey="services"`)
- `feature_cards` (`pageSlug="about"`, `sectionKey="philosophy"`)
- `feature_cards` (`pageSlug="technology"`, `sectionKey="stack"`)

* **Deep Link Target**: `/admin/content?model=feature_cards&search=home:services` (or pre-filled create `/admin/content/new?collection=feature_cards&pageSlug=home&sectionKey=services`)
* **Editor Experience**: Shared pool of cards. Requires the CMS list UI to support query-param search or property filtering to prevent seeing unrelated cards.
* **Trade-offs**:
  - ✅ Minimal CMS schema bloat (only 6–8 universal archetypes for the entire website).
  - ⚠️ Requires editors to manage tags/keys, or relies on CMS UI filtering capabilities.

---

### Approach 3: Hierarchical / Container Models (Parent-Child Repeater)
The parent section document (`section-home-services` in `page_sections`) contains an embedded repeater or JSON array field for its child items:
```json
{
  "title": "Our Services",
  "badgeText": "Capabilities & Expertise",
  "cards": [
    { "title": "Technical Consulting", "summary": "..." },
    { "title": "Product Development Collaboration", "summary": "..." },
    { "title": "Pragmatic AI Strategy", "summary": "..." }
  ]
}
```
* **Deep Link Target**: `/admin/content/section-home-services/edit`
* **Editor Experience**: The editor opens a single edit screen and can update the section header, add/remove cards, and reorder them in place.
* **Trade-offs**:
  - ✅ Natural 1:1 container mapping for non-reusable layout content.
  - ⚠️ Requires the CMS to support structured blocks, repeaters, or JSON schema arrays.

---

## 3. SlotWire Canonical Routing Rules

SlotWire CMS adapters enforce the following routing matrix:

| Scenario | Data Cardinality | Document ID | Action | Resolved Link |
| :--- | :--- | :--- | :--- | :--- |
| **Single Document Edit** | $N = 1$ | Present (`id`) | `edit` | `/admin/content/:id/edit` |
| **Multi-Item Collection Slot** | $N > 1$ (Array) | None | `list` | `/admin/content?model=:collection` |
| **Collection Archetype Slot** | Any (`cards`, `gallery`, etc.) | None | `list` | `/admin/content?model=:collection` |
| **Single Container Create** | $N = 0$ (Missing) | None | `create` | `/admin/content/new?collection=:collection&pageSlug=...` |

---

## 4. Architectural Guidelines for Developers

1. **Domain Entities $\rightarrow$ Explicit Collections**:
   If content represents a distinct business entity (Services, Ventures, Testimonials, Team Authors, Blog Posts), define an **explicit dedicated collection**.
2. **Generic Layout Blocks $\rightarrow$ Shared Archetypes**:
   If content represents generic, reusable layout slices (Generic Bento Cards, Image Carousels, FAQs), use **shared semantic archetypes** with composite tagging (`pageSlug`, `sectionKey`).
3. **Item-Level Tagging**:
   When rendering collections in Astro, developers may optionally wrap individual card items with `<SlotWire documentId={item.id}>` to provide direct item-level edit hover badges alongside the parent collection list badge.
