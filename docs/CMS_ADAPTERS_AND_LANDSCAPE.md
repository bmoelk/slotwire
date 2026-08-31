# SlotWire CMS Adapters Specification, Authoring Paradigms & Headless Landscape

> **Core Thesis**: SlotWire is **not a CMS**. It is an **experience bridge, schema contract validator, and visual telemetry layer** that sits between your frontend framework (Astro) and whatever headless CMS or content source you choose.
>
> Headless architecture decoupled content from presentation, but created friction: **editors lost visual context**, **developers inherited loose schema contracts**, and **empty slots broke page layouts**. SlotWire restores that cohesive experience across both database-backed and Git-backed CMSs without locking you into a proprietary monolithic stack.

---

## 1. Universal Adapter Interface (`SlotWireCmsAdapter`)

SlotWire unifies disparate CMS platforms behind a standard modular interface in `@slotwire/core`:

```typescript
export interface DocumentContext {
  collection: string;
  documentId: string;
  slug: string;
  status: 'draft' | 'published';
  data: Record<string, unknown>;
}

export interface SlotWireCmsAdapter {
  readonly provider: string;

  /** Generates the provider-specific administrative URL */
  buildAdminLink(context: CmsDeepLinkOptions): string;

  /** Resolves canonical document context from CMS server hooks (optional) */
  resolveDocumentContext?(context: unknown): DocumentContext;
}
```

### Modular Implementation Architecture (`packages/core/src/adapters/`):
```
packages/core/src/adapters/
├── types.ts          # SlotWireCmsAdapter & DocumentContext interfaces
├── base.ts           # BaseCmsAdapter abstract class (URL cleaning & query param formatting)
├── sonicjs.ts        # SonicJsAdapter (Direct /content/:id/edit, ?model=, /content/new)
├── git.ts            # BaseGitAdapter, KeystaticAdapter, DecapAdapter (Sveltia alias)
├── strapi.ts         # StrapiAdapter (collectionType routing)
├── payload.ts        # PayloadAdapter (collections routing)
├── directus.ts       # DirectusAdapter (content/:collection/:id routing on SQL)
├── default.ts        # DefaultAdapter fallback
└── index.ts          # Adapter Registry, registerCmsAdapter, buildCmsDeepLink
```

---

## 2. SlotWire Adapter Roadmap & Support Tiers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SLOTWIRE FOCUSED ROADMAP TIERS                        │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│ 🟢 ACTIVE (Tier 1)      │ 🟡 PLANNED (Tier 2)     │ 🔴 EXCLUDED (Tier 3)    │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • SonicJS AI (Edge D1)  │ • The Unified Git Layer │ • Sanity.io             │
│   (Production Verified) │   - Decap / Sveltia CMS │   (Heavy SaaS Support)  │
│ • Strapi / Payload /    │   - Keystatic (MDX)     │ • TinaCMS               │
│   Directus (Core Rel.   │   (Shared Astro Content │   (React Island Lock-in)│
│   SQL Adapters)         │    Directory Engine)    │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### Strategic Rationale:

1. **Active (Tier 1) — Edge & Self-Hosted SQL**:
   - **SonicJS AI (Cloudflare D1)**: Primary production reference target on `brainendeavor.com`. Sub-second live previews (`slotwire_preview=true`), instant 0ms edge publishing, and direct `/content/:id/edit` deep-linking.
   - **Strapi, Payload & Directus**: The dominant open-source self-hosted Node/TypeScript data engines with pre-built `@slotwire/core` adapter modules.
2. **Planned (Tier 2 — The Unified Git Core Engine)**:
   - **Decap / Sveltia CMS & Keystatic**: Both store content as Markdown/MDX/JSON files in Astro's native `src/content/:collection/:slug` directory structure.
   - **Shared Core Git Engine**: 90% of the logic (blueprint generation, Zod frontmatter contract validation, orphan slug detection) is **identical** between Decap and Keystatic.
   - **Lightweight URL Mappers**: The only difference is admin route formatting (`/keystatic/collection/...` vs `/admin/#/collections/...`).
3. **Explicitly Excluded (Tier 3)**:
   - **Sanity.io**: Proprietary hosted SaaS with its own Presentation Tool, complex `stega` string encoding, and enterprise customer support expectations. Not aligned with SlotWire's lean, developer-first, open-source scope.
   - **TinaCMS**: Relies on its own proprietary iframe React runtime (`useTina()`), forcing Astro pages into heavy client-side React islands (`client:load`).

---

## 3. Astro Headless CMS Market Share & Ecosystem Data

Based on Astro ecosystem surveys, community adoption patterns, and integration downloads, headless content management for Astro breaks down into three distinct tiers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ASTRO CMS ADOPTION BY MARKET SHARE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Git-Backed / Local Files (~55-60% of Astro Sites)                        │
│    • Astro Content Collections (Built-in default for ~60%+ of simple sites) │
│    • Decap CMS / Sveltia CMS (Dominant open-source Git admin)                │
│    • Keystatic (Rising developer favorite for TypeScript/MDX)               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Self-Hosted / Edge-Native Open Source (~25-30% of Astro Sites)           │
│    • SonicJS AI (Cloudflare Workers + D1 SQLite at edge)                    │
│    • Strapi (Leading self-hosted enterprise Node.js CMS)                    │
│    • Payload CMS (Next/Node TypeScript code-first CMS)                      │
│    • Directus (Open data platform on SQL)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Hosted SaaS & Enterprise Cloud (~15-20% of Astro Sites)                  │
│    • Sanity.io (Leading schema-as-code cloud CMS for Astro)                 │
│    • Storyblok (Popular for marketing-led visual page building)             │
│    • Contentful (Legacy enterprise Jamstack)                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Stack Comparison: Astro + CMS (Without vs. With SlotWire)

| Frontend + Headless Stack | Status | Experience Without SlotWire (The Friction) | Experience WITH SlotWire (The Multiplier) | Best Fit |
| :--- | :--- | :--- | :--- | :--- |
| **Astro + SonicJS AI** *(Cloudflare Edge D1)* | 🟢 **ACTIVE** | ⚡ Instant edge database updates, but editors must leave the site, browse `/admin/content`, and hunt through raw tables to find the right record. Missing records collapse layouts. | 🚀 **In-situ 1-click deep links** (`/content/:id/edit`), dynamic collection list routing, **Ghost wireframes** for empty slots, and sub-second edge SSR live preview. | Edge-native, serverless sites on Cloudflare Workers & D1. |
| **Astro + Directus** *(SQL / Postgres / MySQL)* | 🟢 **ACTIVE** | 🗄️ Instant REST/GraphQL on top of SQL, but editors must find items inside large database tables. | 🎯 **Direct deep links** straight to `/admin/content/:collection/:id` or collection creation `/admin/content/:collection/+`. | Full-stack teams with existing SQL databases. |
| **Astro + Strapi / Payload** *(Node.js / Relational)* | 🟢 **ACTIVE** | 🏢 Enterprise relational models, but editors get lost navigating deep content-manager relation trees and collection menus. | 🔗 Direct deep links into specific relational document entities (`/admin/content-manager/.../:id`), shielding editors from database complexity. | Large teams with complex relational content & custom workflows. |
| **Astro + Keystatic** *(Git / GitHub API / MDX)* | 🟡 **PLANNED** | 📝 Great TypeScript schema in VS Code, but editing is siloed inside the `/keystatic` dashboard. Zero visual in-context editing on the live page; 2-min CI/CD rebuilds. | 🎯 **In-situ HUD badges** route directly into specific Keystatic entry forms. Build-time contract validator verifies Git frontmatter before deploy. | Content-heavy, documentation, or Git-centric blogs. |
| **Astro + Decap CMS / Sveltia** *(Git / Static SPA)* | 🟡 **PLANNED** | 📄 Flat Markdown file editor with side-by-side HTML preview. No concept of section slots, layout grids, or component schemas. | 🧩 Transforms unstructured Markdown collections into **structured slot blueprints** with contract validation and orphan reference detection. | Simple static sites with minimal infrastructure. |
| **Astro + Sanity.io** *(Cloud SaaS / GROQ)* | 🔴 **EXCLUDED** | ☁️ Proprietary cloud database with high-touch enterprise support overhead and complex stega string encoding. | ❌ *Excluded from roadmap*: High maintenance burden, enterprise SaaS lock-in. | Enterprise teams committed to Sanity's paid ecosystem. |
| **Astro + TinaCMS** *(Git / GraphQL)* | 🔴 **EXCLUDED** | ⚠️ **The React Island Trap**: To get Tina's visual editing, developers are forced to rewrite `.astro` components into heavy client-side React islands (`client:load`). | ❌ *Excluded from roadmap*: Hardwired to React iframe runtime. | Teams locked into Next.js/React. |


---

## 5. The Unified Git Layer: Decap CMS & Keystatic

Because Astro already standardizes Git content in `src/content/`, SlotWire's Core Git engine treats Git files as first-class citizens:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SLOTWIRE CORE GIT ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│               Astro Content Collections (`src/content/`)                    │
│                 ├── `services/srv-technical-consulting.md`                  │
│                 ├── `projects/splitphase.md`                                │
│                 └── `page_sections/section-home-services.json`              │
│                                      │                                      │
│                                      ▼                                      │
│               SlotWire Shared Contract & Telemetry Engine                   │
│                 ├── Zod Frontmatter Contract Validation                     │
│                 ├── Orphan Slug Detection (Missing .md files)               │
│                 └── In-Situ Hover HUD & Ghost Wireframes                    │
│                                      │                                      │
│                     ┌────────────────┴────────────────┐                     │
│                     ▼                                 ▼                     │
│           Keystatic URL Mapper               Decap/Sveltia URL Mapper       │
│      `/keystatic/collection/:c/item/:s`    `/admin/#/collections/:c/entries/:s`
└─────────────────────────────────────────────────────────────────────────────┘
```

* **Build-Time Contract Check**: SlotWire verifies that required Markdown frontmatter fields match the Astro component contract before Git commit.
* **Orphan Slug Safety**: If a section references `card_slugs: ["srv-consulting", "srv-deleted"]`, SlotWire flags the missing `.md` file with an in-situ Ghost chip.

---

## 6. Comparing Authoring Paradigms & Edge Vision

| Dimension | 1. Direct Git / MDX | 2. Keystatic CMS | 3. Edge SQLite (SonicJS + D1) | 4. Ideal Headless / Git CMS Vision *(BrainEndeavor Perspective)* |
| :--- | :--- | :--- | :--- | :--- |
| **Target Author** | Developers only (CLI, VS Code, Git branching). | Content writers & devs via web UI within Astro. | Any user/editor on web browser (desktop, tablet, mobile). | Any author with in-situ live editing on the actual page. |
| **Storage Backend** | Git repository (Markdown / MDX files). | Git repository (Markdown / MDX / JSON). | Cloudflare D1 (Distributed SQLite at edge) + R2. | **Pluggable & Git-Backed**: Git repo (documents) + R2 edge publication cache. |
| **Hosting & Runtime** | Static site build (SSG). | React SPA bundled inside Astro; local mode or Keystatic Cloud. | Serverless Cloudflare Worker + D1 SQLite at edge. | Edge worker runtime (Cloudflare Workers / SSR) with incremental rendering. |
| **Editing Latency / Responsiveness (UX/EX)** | Instant local text editing in IDE, but high barrier to entry. | Fast local keystrokes, but sluggish in Cloud mode due to remote GitHub API roundtrips. | Variable; depends on CMS editor implementation and network latency to Worker/D1. | **Instant UX/DX/EX responsiveness**: Sub-second UI updates, optimistic client state, seamless editor. |
| **Drafting & Preview** | Run `npm run dev` locally. | Branch-based preview in GitHub / local dev. | **Sub-second edge SSR Live Preview** (`slotwire_preview=true`). | **Universal In-Situ Live Preview** across any backend with SlotWire HUD. |
| **Publishing Latency** | 1–3 min CI/CD rebuild on every git commit. | 1–3 min CI/CD rebuild on every GitHub commit. | **Instant (0 ms rebuild)**: Edge D1 update + cache purge (does not require full static site rebuild). | **Incremental Edge Update**: Git commit/tag triggers incremental R2 push; zero full rebuild. |
| **Git API Coupling** | Native Git CLI (`git commit`, `git push`). | Strongly coupled to **GitHub REST/GraphQL API** (or local FS). | Completely decoupled from Git (pure database). | **Standard Git Transport** (`git+https`, `isomorphic-git`, or libgit2) — agnostic of hosting platform. |

### Hybrid Architecture: Edge D1 Cache + Git Background Sync
* **Concept**: Authors edit in a fast Edge CMS (sub-second D1 SQLite), while an automated background worker periodically serializes published documents into clean Markdown/MDX files and commits them to Git.
* **Advantage**: Instant zero-rebuild publishing for editors, paired with automated Git backups and version history for developers.

---

## 7. The 3 Value Pillars: How SlotWire Elevates UX, EX, and DX

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           THE SLOTWIRE VALUE PILLARS                        │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│  1. DX (Developer)      │  2. EX (Editor)         │  3. UX (User/Visitor)   │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Zero client JS in prod│ • In-situ visual editing│ • Zero layout collapse  │
│ • Zod contract check    │ • 1-click CMS deep links│ • Resilient fallback UI │
│ • Orphan slug detection │ • No hunting in tables  │ • Sub-second previews   │
│ • Framework native      │ • Contextual pre-fills  │ • Blazing fast static   │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 8. SlotWire Boundary & Strategic Pushback Directive

> [!IMPORTANT]
> **Pushback & Scope Boundary Directive**:
> - **SlotWire is strictly a Contract, Telemetry, and Visual In-Context Bridge — NEVER an ORM, data fetcher, or proprietary CMS backend.**
> - SlotWire stays **100% provider-agnostic** via the universal `SlotWireCmsAdapter` interface.
> - Whether a site chooses SonicJS (D1), Keystatic (GitHub), Decap (Git), or an enterprise SQL store, SlotWire enforces the schema contract, injects the visual in-situ HUD, and handles deep linking into the appropriate editor.
