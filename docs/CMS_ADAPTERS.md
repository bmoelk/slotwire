# SlotWire CMS Adapters Specification

## 1. The Headless CMS Challenge

Every headless CMS (SonicJS, Strapi, Payload, Directus, Sanity) implements content modeling differently. However, all headless CMS architectures share fundamental concepts:
* **Collections / Content Types / Schemas**: Named data models.
* **Documents / Records**: Individual content entries identified by an ID and a Slug.
* **Workflow States**: Draft vs. Published versions.

SlotWire unifies these disparate platforms behind the **`SlotWireCmsAdapter`** interface.

---

## 2. Universal Adapter Interface (`SlotWireCmsAdapter`)

```typescript
export interface SlotWireCmsAdapter {
  readonly provider: 'sonicjs' | 'strapi' | 'payload' | 'sanity' | 'directus';

  /** 1. Introspects CMS schema and returns all collections, fields, and types */
  introspectSchema(): Promise<SlotWireSchemaDescriptor>;

  /** 2. Resolves canonical document context from CMS server hooks */
  resolveDocumentContext(context: unknown): {
    collection: string;
    documentId: string;
    slug: string;
    status: 'draft' | 'published';
    data: Record<string, unknown>;
  };

  /** 3. Generates the editor preview button and environment selector */
  renderEditorToolbar(options: ToolbarOptions): string;
}
```

---

## 3. Supported & Planned Adapters

### `@slotwire/sonicjs` (Current)
* **Runtime**: Cloudflare Workers / D1.
* **Hook**: Injects the streamlined SlotWire Preview toolbar into SonicJS form templates.
* **Context Resolution**: Server-side extraction of `data.collection.name` and `data.content.slug`.
* **Environment Switcher**: Client-side dropdown supporting Production, Staging Pages, and Localhost (persisted in `localStorage`).

### `@slotwire/strapi` (Planned)
* **Runtime**: Node.js / Koa.
* **Hook**: Custom Admin panel button extension in Content Manager edit view.
* **Context Resolution**: Uses Strapi `useCMEditViewDataManager()` to access `slug` and `contentType`.

### `@slotwire/payload` (Planned)
* **Runtime**: Next.js / Node.js.
* **Hook**: Custom Payload component in `admin.components.views.Edit.Default`.
* **Context Resolution**: Native Payload `useDocumentInfo()` context.
