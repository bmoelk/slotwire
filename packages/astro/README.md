# astro-slotwire

Astro integration and visual in-situ contract bridge for **SlotWire**.

Provides semantic visual slot encapsulation (`<SlotWire />`), Ghost slot placeholders for unpopulated CMS content, live draft telemetry badges, and the floating staging authoring bubble (`<AssistBubble />`).

---

## 📦 What is Required to Integrate into an Out-of-the-Box Astro Project

Integrating SlotWire into any standard Astro site requires only **4 standard steps**:

### 1. Install Dependencies

```bash
npm install @slotwire/core astro-slotwire
```

---

### 2. Define Content Contracts (`slotwire.config.ts`)

Create `slotwire.config.ts` in your project root:

```typescript
import { defineContract, s } from '@slotwire/core';

export default defineContract({
  cms: {
    provider: 'slottd', // 'slottd' | 'directus' | 'sonicjs' | 'strapi' | 'payload'
    apiUrl: 'https://cms.yourdomain.com',
  },

  slots: {
    hero: s.object({
      title: s.string().max(120),
      description: s.string().max(300),
      ctaText: s.string(),
      ctaUrl: s.url(),
    }),

    projects: s.collection('projects', {
      name: s.string(),
      description: s.string(),
      badgeText: s.string().optional(),
    }),
  },
});
```

---

### 3. Configure `astro.config.mjs`

Add the `slotwire` integration and configure output mode:

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { slotwire } from 'astro-slotwire';
import slotwireConfig from './slotwire.config.js';

// Staging compiles to dynamic SSR Worker; Production compiles to 100% static SSG
const isStaging = process.env.ENVIRONMENT === 'staging';

export default defineConfig({
  output: isStaging ? 'server' : 'static',
  adapter: cloudflare(),
  integrations: [
    slotwire({ config: slotwireConfig }),
  ],
});
```

> [!NOTE]
> **No Dev Toolbar Hacks Needed**: In staging builds (`output: 'server'`), Astro automatically compiles away the Astro Dev Toolbar (`import.meta.env.DEV` is `false`). Staging runs as a clean serverless Worker isolate.

---

### 4. Mount Assist Bubble in Your Layout

Import `<AssistBubble />` in your primary layout (e.g. `src/layouts/BaseLayout.astro`):

```astro
---
import AssistBubble from "astro-slotwire/AssistBubble.astro";
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My Site</title>
  </head>
  <body>
    <slot />

    <!-- Injected only on staging or when ?slotwire_assist=true is present -->
    <AssistBubble />
  </body>
</html>
```

---

### 5. Wrap Content with `<SlotWire />`

Wrap your UI sections with `<SlotWire />`:

```astro
---
import SlotWire from "astro-slotwire/SlotWire.astro";
import { getProjects } from "@/lib/cms";

const projects = await getProjects();
---

<SlotWire slot="projects" archetype="cards" collection="projects" data={projects} required={true}>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {projects.map((item) => (
      <div class="card">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
      </div>
    ))}
  </div>

  <!-- Fallback rendered when slot is empty in CMS -->
  <div slot="fallback">
    <p>Default projects fallback...</p>
  </div>
</SlotWire>
```

---

## ⚡ Runtime Behavior by Environment

| Environment | Output Mode | Assist Bubble | Slot Badges | CMS Data Fetching | Client JS Overhead |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Local Dev (`astro dev`)** | Development | Inert unless `?slotwire_assist=true` | Standard In-Situ Badges | Local CMS (`http://localhost:8787`) | Dev mode only |
| **Staging (`edit.domain.com`)** | SSR (`output: 'server'`) | **Active Floating Bubble** | Status Tags (`Published`, `Draft Modified`, `New`) | Live Working Copy (`version=draft`, `cache: 'no-store'`) | Lean Web Component |
| **Production (`domain.com`)** | Static (`output: 'static'`) | **Stripped / Inert** | Stripped / Inert | Published Only (`cache: 'default'`) | **0 KB** (Pure Semantic HTML) |

---

## 🔌 Staging Draft Data Fetching

In your CMS data helper (`src/lib/cms.ts`):

```typescript
export async function queryCms(collection: string, options: { preview?: boolean } = {}) {
  const isPreview = Boolean(options.preview);
  const params = new URLSearchParams();

  if (isPreview) {
    params.set('version', 'draft'); // Query working copy deltas
  } else {
    params.set('filter[status][_eq]', 'published'); // Only live records
  }

  const res = await fetch(`https://cms.yourdomain.com/items/${collection}?${params.toString()}`, {
    cache: isPreview ? 'no-store' : 'default',
  });

  return res.json();
}
```
