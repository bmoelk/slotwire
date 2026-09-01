# SlotWire Canonical Architecture & Domain Glossary

This document establishes the official terminology, concepts, and domain definitions for the **SlotWire** ecosystem across frontend frameworks (Astro), headless CMS backends (SonicJS, Strapi, Payload), and edge runtimes (Cloudflare Workers).

---

## 1. Core Architectural Concepts

### Contract (`slotwire.config.ts` / `slotwire.contract.json`)
The declarative, two-way structural binding between frontend visual components and headless CMS data models. Backed by Zod schemas, the contract defines collections, singletons, validation rules, and reverse-route mappings.

### Slot (`<SlotWire />`)
A designated visual container in the frontend template (e.g. Hero, Bento Grid, Testimonials Carousel) that binds to one or more CMS data models. Rendered in Astro via `<SlotWire slot="slot_key" data={data}>`.

### Ghost Slot (`<SlotWireGhost />`)
An interactive placeholder rendered in preview mode (`slotwire_preview=true`) when a required slot is empty or missing content in the CMS database. Prevents visual layout collapse, displays structural diagnostics (*"UNPOPULATED SLOT: feature_cards"*), and provides a 1-click deep link to populate the record in the CMS.

### Semantic Structural Archetype
A standardized, high-level content composition pattern (e.g., `Page`, `Section`, `Feature Cards Bento`, `Gallery`, `Endorsements`, `Q&A Accordion`). Archetypes replace ad-hoc schemas with predictable, composable content structures.

### Design-First Template Distillation
The architectural approach of deriving content schemas, slot requirements, and archetypes directly from the visual component hierarchy and page layout designs in Astro, rather than designing abstract database models in isolation.

### Navigation Contract (`s.navigation`)
The declarative schema binding that defines and manages site navigation structures (Top Header, Nested Dropdowns, Footer Links) as CMS collections, enabling automatic linking of newly scaffolded pages.

### Content Blueprint
The resolved dependency tree of all CMS collections, singletons, and relational foreign keys required to assemble a specific page layout or archetype. Blueprints are calculated deterministically from the declared `<SlotWire />` slots on a route.

---

## 2. Scaffolding & Composition Strategies

### Pre-Create (Visual Archetype Cloner)
The editorial workflow enabling a content creator browsing an existing page in preview mode to click *"Pre-Create Page Like This"*. SlotWire introspects the active visual slots, calculates the blueprint, prompts for the new route slug, and batch-creates all required CMS draft records in one atomic step.

### Cascade Scaffolding (`strategy: 'cascade'`)
A scaffolding strategy for hierarchical content where new child records are recursively created down the dependency tree (e.g., creating a new `pages` record also creates new `page_sections` and 4x `feature_cards` records tied to `pageSlug="new-page"`).

### Content Reference & Reuse (`strategy: 'reference'`)
A scaffolding strategy where an archetype binds to existing shared global content (e.g., global testimonial collection, author profile singleton, or global footer CTA) rather than generating redundant duplicate records in the CMS.

---

## 3. Live Compilation & Developer Experience (DX)

### Shift-Left Live Compilation
The architectural principle of auditing slot contracts, AST declarations, and CMS draft data continuously during the active authoring/preview cycle, rather than deferring validation to a late CI/CD build failure.

### Interactive Blueprint Checklist HUD
The in-situ preview drawer that pairs spatial visual canvas cues with a structured hierarchical checklist. Displays real-time completeness progress (`3/4 Slots Populated (75%)`), 1-click `[ 📍 Scroll to Canvas ]` jumps, and direct CMS edit links.

### Live Slot Morphing
The zero-reload client-side transition mechanism. When the CMS emits a debounced document save event over Server-Sent Events (SSE), Astro edge SSR evaluates the updated component snippet, and the client uses `document.startViewTransition()` to smoothly morph the dashed Ghost Slot into live styled content without refreshing the page.

### 2-Pass Reverse Route Resolver
The routing engine that translates incoming CMS document contexts (`collection`, `slug`, `id`) into canonical frontend URL routes (`/blog/{slug}`, `/#features`, `/{pageSlug}#gallery`) using exact matching followed by fuzzy normalization.

---

## 4. Production & Quality Gate Concepts

### Production Semantic Tagging (`data-slotwire-*`)
Lightweight HTML dataset attributes (`data-slotwire-slot`, `data-slotwire-archetype`, `data-slotwire-collection`, `data-slotwire-page`, `data-slotwire-id`) preserved in production markup with zero JavaScript runtime overhead. Allows diagnostics and external ticketing tools to map production elements back into CMS records.

### Production Content Ticket Loop
The workflow where an editor or QA reviewer spotting a gap on an immutable production page triggers a diagnostic action that reads `data-slotwire-*` attributes and dispatches a pre-filled "Fix Content Ticket" deep-linked directly to the corresponding staging draft.

### Headless Scanner (`@slotwire/cli scan`)
The automated static analysis and crawler tool that scans built HTML (`dist/**/*.html`) or live SSR routes, cross-references against CMS APIs, and outputs a site-wide Content Gap Matrix.

### Orphan Scanner
A diagnostic scanner that detects "ghost documents" in the CMS database (records with no matching frontend route), dangling foreign-key references, and unreferenced media assets.

---

## 5. Security & Multi-Environment Concepts

### Preview Bridge (`/api/preview`)
The secure edge endpoint in Astro that receives signed dispatch tokens from the CMS, validates HMAC signatures, sets the HTTP-only `slotwire_preview` session cookie, and renders developer telemetry.

### Headless Disconnect (CMS Hangover)
The industry challenge where decoupling the CMS from the frontend strips away presentation context, forcing editors to fill out blind database forms without immediate visual feedback. SlotWire eliminates this disconnect.
