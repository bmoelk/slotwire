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

export interface SlotWireConfig {
  cms: {
    provider: 'sonicjs' | 'custom';
    apiUrl: string;
    apiKey?: string;
    previewSecret?: string;
  };
  slots: Record<string, SlotDefinition>;
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

