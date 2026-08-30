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

export interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  maxLength?: number;
  description?: string;
  options?: string[];
  refTarget?: string;
  items?: FieldDefinition;
  properties?: Record<string, FieldDefinition>;
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
  | 'cards'
  | 'gallery'
  | 'endorsements'
  | 'qa'
  | 'singleton'
  | string;

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
  action?: 'create' | 'edit';
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
  defaultData?: Record<string, any>;
  defaultFilter?: Record<string, any>;
}

export interface ArchetypeDefinition {
  name: string;
  collection: string;
  slots: Record<string, ArchetypeSlotDefinition>;
  description?: string;
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

export interface ScaffoldResult {
  success: boolean;
  targetSlug: string;
  createdCount: number;
  createdIds: string[];
  reusedCount?: number;
  errors?: string[];
  targetUrl?: string;
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
  slots: Record<string, SlotDefinition>;
  archetypes?: Record<string, ArchetypeDefinition>;
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
  isFullyCovered: boolean;
}

export interface OrphanedContentItem {
  id: string;
  collection: string;
  title: string;
  slug: string;
  reason: 'unreachable_route' | 'dangling_reference' | 'unreferenced_media';
  details: string;
}

export interface OrphanedContentReport {
  timestamp: string;
  apiUrl: string;
  totalChecked: number;
  ghostDocuments: OrphanedContentItem[];
  danglingReferences: OrphanedContentItem[];
  deadMedia: OrphanedContentItem[];
  isClean: boolean;
}

