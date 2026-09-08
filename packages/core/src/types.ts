import { z } from 'zod';

export type FieldType =
  | 'string'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'slug'
  | 'url'
  | 'email'
  | 'datetime'
  | 'media'
  | 'richText'
  | 'enum'
  | 'array'
  | 'object'
  | 'reference';

export interface MediaFieldOptions {
  allowedExtensions?: string[];
  checkExists?: boolean;
  source?: 'r2' | 'cdn' | 'local' | 'any';
  required?: boolean;
  recommendation?: string;
}

export interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  maxLength?: number;
  description?: string;
  options?: string[];
  refTarget?: string;
  items?: FieldDefinition;
  properties?: Record<string, FieldDefinition>;
  mediaOptions?: MediaFieldOptions;
  zodSchema: z.ZodTypeAny;
}

export type PreviewRouteFn = (doc: Record<string, any>) => string;
export type PreviewRoute = string | PreviewRouteFn;

export type SlotDefinition =
  | {
      kind: 'object';
      properties: Record<string, FieldDefinition>;
      zodSchema: z.ZodTypeAny;
      previewRoute?: PreviewRoute;
      previewRouteFn?: (route: PreviewRoute) => SlotDefinition;
    }
  | {
      kind: 'collection';
      collectionName: string;
      properties: Record<string, FieldDefinition>;
      zodSchema: z.ZodTypeAny;
      previewRoute?: PreviewRoute;
      previewRouteFn?: (route: PreviewRoute) => SlotDefinition;
    };

export type SlotArchetype =
  | 'page'
  | 'section'
  | 'hero'
  | 'cards'
  | 'gallery'
  | 'endorsements'
  | 'testimonials'
  | 'qa'
  | 'faq'
  | 'table'
  | 'timeline'
  | 'stats'
  | 'cta'
  | 'singleton'
  | string;

export interface ArchetypeCatalogItem {
  id: string;
  name: string;
  description: string;
}

export const SLOT_ARCHETYPES: ArchetypeCatalogItem[] = [
  { id: 'section', name: 'section (Standard Container)', description: 'Generic page section container' },
  { id: 'cards', name: 'cards (Grid / Feature Bento)', description: 'Multi-item card grid or feature tiles' },
  { id: 'hero', name: 'hero (Banner / Split Headline)', description: 'Page hero header with image/copy' },
  { id: 'testimonials', name: 'testimonials (Quotes / Endorsements)', description: 'Client reviews and colleague endorsements' },
  { id: 'faq', name: 'faq (Accordion / Q&A Items)', description: 'Frequently asked questions and answers' },
  { id: 'table', name: 'table (Pricing / Comparison Table)', description: 'Structured tabular data or pricing tiers' },
  { id: 'gallery', name: 'gallery (Media / Images)', description: 'Image gallery or visual portfolio' },
  { id: 'timeline', name: 'timeline (Milestones / Roadmap)', description: 'Chronological timeline or milestone steps' },
  { id: 'stats', name: 'stats (Counter / Metric Grid)', description: 'Key performance indicators and statistics' },
  { id: 'cta', name: 'cta (Call-to-Action Block)', description: 'Promotional call to action banner' },
  { id: 'custom', name: 'custom / unknown / new (Custom Schema or New Pattern)', description: 'Custom schema or new component pattern to be defined' },
];


export interface SlotMetadata {
  slot: string;
  archetype?: SlotArchetype;
  collection?: string;
  pageSlug?: string;
  sectionKey?: string;
  documentId?: string;
  required?: boolean;
}

export interface CmsDeepLinkOptions {
  provider?: 'sonicjs' | 'strapi' | 'payload' | 'custom' | string;
  adminUrl?: string;
  collection?: string;
  documentId?: string;
  pageSlug?: string;
  sectionKey?: string;
  action?: 'create' | 'edit' | 'list';
  archetype?: string;
}

export type ArchetypeSlotStrategy = 'cascade' | 'reference' | 'reuse_shared';

export interface ArchetypeSlotDefinition {
  kind: 'page' | 'section' | 'collection' | 'reference' | 'singleton';
  collection: string;
  key?: string;
  strategy?: ArchetypeSlotStrategy;
  children?: Record<string, ArchetypeSlotDefinition>;
  minItems?: number;
  defaultCount?: number;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultPrimaryCtaText?: string;
  defaultPrimaryCtaUrl?: string;
  defaultData?: Record<string, any>;
  defaults?: Array<Record<string, any>>;
  defaultFilter?: Record<string, any>;
}

export interface ArchetypeDefinition {
  name: string;
  collection?: string;
  template?: string;
  slots: Record<string, ArchetypeSlotDefinition>;
  description?: string;
}

export interface NavigationConfig {
  collection?: string;
  menus?: string[];
  schema?: Record<string, FieldDefinition>;
}

export interface BlueprintItem {
  id: string;
  collection: string;
  action: 'create' | 'reference';
  pageSlug: string;
  sectionKey?: string;
  data: Record<string, any>;
  depth: number;
  parentKey?: string;
  slotKey: string;
  description: string;
}

export interface ContentBlueprint {
  archetypeKey: string;
  targetSlug: string;
  targetTitle: string;
  items: BlueprintItem[];
  totalToCreate: number;
  totalToReuse: number;
  generatedAt: string;
}

export interface ScaffoldRecord {
  collection: string;
  data: Record<string, any>;
}

export interface ScaffoldBundle {
  template: string;
  slug: string;
  title: string;
  records: ScaffoldRecord[];
  previewUrl?: string;
}

export interface ScaffoldResult {
  success: boolean;
  status?: 'ok' | 'error';
  targetSlug: string;
  createdCount: number;
  createdIds: string[];
  reusedCount?: number;
  errors?: string[];
  targetUrl?: string;
  previewUrl?: string;
}

export interface SlotwireLoaderOptions {
  collection: string;
  config?: SlotWireConfig;
  filter?: Record<string, any>;
  sort?: string[];
  preview?: boolean;
  limit?: number;
  transform?: (data: any) => any;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';
export type TicketSeverity = 'low' | 'medium' | 'high' | 'blocking';

export interface TicketContext {
  sourceUrl: string;
  route: string;
  slotKey: string;
  archetype?: string;
  collection?: string;
  sectionKey?: string;
  documentId?: string;
  pageSlug?: string;
}

export interface TicketDeepLinks {
  stagingUrl: string;
  cmsEditUrl: string;
}

export interface TicketReporter {
  email?: string;
  authenticatedVia?: string;
}

export interface ContentTicket {
  ticketId: string;
  version: '1.0.0' | string;
  title: string;
  description: string;
  status: TicketStatus;
  severity: TicketSeverity;
  context: TicketContext;
  deepLinks: TicketDeepLinks;
  reporter?: TicketReporter;
  createdAt: string;
  resolvedAt?: string;
}

export interface TicketingConfig {
  webhookUrl?: string;
  internalQueue?: boolean;
}

export interface TicketDispatchOptions {
  webhookUrl?: string;
  internalQueueEndpoint?: string;
  apiKey?: string;
}

export interface TicketDispatchResult {
  success: boolean;
  ticketId: string;
  webhookDispatched: boolean;
  internalQueueSaved: boolean;
  errors?: string[];
}

export interface TokenPayload {
  collection?: string;
  slug?: string;
  exp: number;
  iat: number;
  role?: string;
}

export interface VerifyTokenResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

export interface BookmarkletOptions {
  adminUrl?: string;
  stagingUrl?: string;
  provider?: string;
  webhookUrl?: string;
}

export interface SlotWireConfig {
  cms: {
    provider: 'sonicjs' | 'custom' | string;
    apiUrl: string;
    apiKey?: string;
    previewSecret?: string;
  };
  staticTagging?: boolean;
  ticketing?: TicketingConfig;
  navigation?: NavigationConfig;
  slots: Record<string, SlotDefinition>;
  archetypes?: Record<string, ArchetypeDefinition>;
}

export interface MissingMediaItem {
  slotKey: string;
  collection: string;
  documentId: string;
  documentTitle?: string;
  documentSlug?: string;
  field: string;
  mediaPath: string;
  recommendation?: string;
}

export interface FallbackSlotItem {
  slotKey: string;
  archetype?: string;
  itemCount: number;
  recommendation?: string;
}

export interface SlotValidationResult {
  slotKey: string;
  kind: 'object' | 'collection';
  status: 'valid' | 'missing' | 'partial' | 'invalid';
  totalFields: number;
  populatedFields: number;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
  missingMedia?: MissingMediaItem[];
  isFallback?: boolean;
  payloadCount?: number;
  previewUrl?: string;
}

export interface ContractValidationReport {
  timestamp: string;
  apiUrl: string;
  totalSlots: number;
  validSlots: number;
  partialSlots: number;
  missingSlots: number;
  results: SlotValidationResult[];
  missingMedia: MissingMediaItem[];
  fallbackSlots?: FallbackSlotItem[];
  recommendations: string[];
  isFullyCovered: boolean;
}

export interface OrphanedContentItem {
  id: string;
  collection: string;
  title: string;
  slug: string;
  reason: 'unreachable_route' | 'dangling_reference' | 'unreferenced_media' | 'missing_media';
  details: string;
  recommendation?: string;
}

export interface OrphanedContentReport {
  timestamp: string;
  apiUrl: string;
  totalChecked: number;
  ghostDocuments: OrphanedContentItem[];
  danglingReferences: OrphanedContentItem[];
  deadMedia: OrphanedContentItem[];
  missingMedia: OrphanedContentItem[];
  recommendations: string[];
  isClean: boolean;
}

