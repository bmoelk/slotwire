import { z } from 'zod';
import type { FieldDefinition, SlotWireConfig, MediaFieldOptions, ScaffoldBundle, EditableFieldDescriptor, SlotTransformer } from './types.js';
declare class FieldBuilder {
    private def;
    constructor(type: FieldDefinition['type'], zodSchema: z.ZodTypeAny);
    optional(): this;
    max(length: number): this;
    describe(desc: string): this;
    mediaOptions(opts: MediaFieldOptions): this;
    image(): this;
    or(other: z.ZodTypeAny | FieldBuilder): this;
    build(): FieldDefinition;
}
export declare const s: {
    string: () => FieldBuilder;
    textarea: () => FieldBuilder;
    number: () => FieldBuilder;
    boolean: () => FieldBuilder;
    slug: () => FieldBuilder;
    url: () => FieldBuilder;
    email: () => FieldBuilder;
    datetime: () => FieldBuilder;
    media: (options?: MediaFieldOptions) => FieldBuilder;
    image: (options?: MediaFieldOptions) => FieldBuilder;
    richText: () => FieldBuilder;
    enum: <T extends string>(values: [T, ...T[]]) => FieldBuilder;
    reference: (targetCollection: string) => FieldBuilder;
    array: (itemBuilder: FieldBuilder) => FieldBuilder;
    nestedObject: (props: Record<string, FieldBuilder>) => FieldBuilder;
    object: (props: Record<string, FieldBuilder>, options?: {
        transform?: SlotTransformer;
        editor?: "markdown" | "html";
    }) => any;
    collection: (collectionName: string, props: Record<string, FieldBuilder>, options?: {
        transform?: SlotTransformer;
        editor?: "markdown" | "html";
    }) => any;
    page: (options: {
        collection?: string;
        template?: string;
        label?: string;
        slots: Record<string, any>;
        description?: string;
        defaultTitle?: string;
        defaultDescription?: string;
    }) => {
        name: string;
        collection: string;
        template: string;
        label: string | undefined;
        slots: Record<string, any>;
        description: string;
        defaultTitle: string | undefined;
        defaultDescription: string | undefined;
    };
    navigation: (options: {
        collection?: string;
        menus?: string[];
        schema?: Record<string, FieldBuilder | any>;
    }) => {
        collection: string;
        menus: string[];
        schema: Record<string, FieldDefinition>;
    };
    section: (options: {
        key?: string;
        collection?: string;
        strategy?: "cascade" | "reference";
        children?: Record<string, any> | any;
        defaultData?: Record<string, any>;
        defaultTitle?: string;
        defaultDescription?: string;
        defaultPrimaryCtaText?: string;
        defaultPrimaryCtaUrl?: string;
        transform?: SlotTransformer;
        editor?: "markdown" | "html";
    }) => {
        kind: "section";
        collection: string;
        key: string | undefined;
        strategy: "reference" | "cascade";
        children: any;
        defaultData: Record<string, any> | undefined;
        defaultTitle: string | undefined;
        defaultDescription: string | undefined;
        defaultPrimaryCtaText: string | undefined;
        defaultPrimaryCtaUrl: string | undefined;
        transform: SlotTransformer | undefined;
        editor: "markdown" | "html" | undefined;
    };
    singleton: (collectionName: string, options?: {
        strategy?: "reference";
    }) => {
        kind: "singleton";
        collection: string;
        strategy: "reference";
    };
    archetype: (name: string, slots: Record<string, any>, options?: {
        collection?: string;
        template?: string;
        description?: string;
    }) => {
        name: string;
        collection: string;
        template: string;
        slots: Record<string, any>;
        description: string | undefined;
    };
};
export declare function interpolateRouteTemplate(template: string, doc?: Record<string, any>): string;
export declare function resolvePreviewRoute(config: SlotWireConfig, slotKeyOrCollection: string, doc?: Record<string, any>): string | null;
export declare function exportContractToJson(config: SlotWireConfig): string;
export declare function defineContract(config: SlotWireConfig): SlotWireConfig;
export declare const defineConfig: typeof defineContract;
/**
 * Extracts the single-entry Zod schema for an Astro Content Layer collection from a SlotWire contract.
 * Automatically enables .passthrough() to permit system/CMS metadata (id, slug, status).
 */
export declare function getSlotEntryZodSchema(config: SlotWireConfig, slotKeyOrCollection: string): z.ZodTypeAny;
export interface GenerateArchetypeBundleOptions {
    pageSlug: string;
    title?: string;
    addToNav?: boolean;
    navMenu?: string;
    customData?: Record<string, any>;
}
/**
 * Generates an atomic bundle of records to be created across CMS collections from an Archetype contract.
 */
export declare function generateArchetypeScaffoldBundle(config: SlotWireConfig, templateKey: string, options: GenerateArchetypeBundleOptions): ScaffoldBundle;
/**
 * Introspects slot contract fields and maps them to UI editable field descriptors for the Quick Drawer.
 */
export declare function getSlotEditableFields(config: SlotWireConfig, slotKeyOrCollection: string): EditableFieldDescriptor[];
/**
 * Resolves the transformer function for a given slot or collection:
 * 1. Checks slot definition's explicit `transform` function.
 * 2. Checks `config.transformers[slotKey]` or `config.transformers['slots.' + slotKey]`.
 * 3. Checks `config.transformers[collection]` or `config.transformers['collections.' + collection]`.
 * 4. Checks `config.transformers[provider]`.
 * 5. Falls back to identity transformer `(x) => x`.
 */
export declare function resolveSlotTransformer(config?: SlotWireConfig, slotKeyOrCollection?: string, context?: {
    archetype?: string;
    collection?: string;
    provider?: string;
}): SlotTransformer;
/**
 * Resolves the editor widget type ('markdown' | 'html') for a given slot:
 * 1. Checks slot definition's explicit `editor` property.
 * 2. Checks `config.ui?.editor`.
 * 3. Defaults to 'html' if provider is 'wordpress', otherwise 'markdown'.
 */
export declare function resolveSlotEditor(config?: SlotWireConfig, slotKeyOrCollection?: string): 'markdown' | 'html';
export {};
//# sourceMappingURL=schema.d.ts.map