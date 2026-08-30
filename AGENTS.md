# SlotWire Agent Guidelines & Operating Directives

## 1. Precision & Contract Integrity Directive (Core Rule)
> **Resist Fallbacks / Defaults — Strongly Prefer to Fail Fast & Hard.**
> For integration, contract resolution, schema mapping, and live preview systems:
> - **NEVER** introduce heuristic fallbacks, silent default values, or "guesswork" fallback strings (e.g. defaulting to dummy slugs or bouncing to `/` silently) that mask integration bugs or make broken configurations appear working.
> - If a slot, collection, route template, document slug, or contract definition is missing, misnamed, unmapped, or invalid: **FAIL IMMEDIATELY** with an explicit, high-visibility, actionable error message.
> - Precision, predictability, and contract transparency are paramount. Silent leniency breaks trust in headless CMS integrations.

## 2. Headless CMS Provider Integration Protocol
- Always leverage the native data structures and server lifecycle hooks of the CMS (`data.collection.name`, `data.content.slug`, `status`) rather than parsing client-side URLs or scraping DOM inputs with JavaScript.
- Maintain provider agnosticism across the universal `SlotWireCmsAdapter` interface.

## 3. Dynamic Preview Directives
- When the `slotwire_preview=true` session cookie or token is present, Astro and content loaders must bypass all build-time/static caches (`cache: 'no-store'`) and dynamically query live draft content from the CMS.
