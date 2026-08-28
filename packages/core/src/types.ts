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

export type SlotDefinition =
  | {
      kind: 'object';
      properties: Record<string, FieldDefinition>;
      zodSchema: z.ZodTypeAny;
    }
  | {
      kind: 'collection';
      collectionName: string;
      properties: Record<string, FieldDefinition>;
      zodSchema: z.ZodTypeAny;
    };

export interface SlotWireConfig {
  cms: {
    provider: 'sonicjs' | 'custom';
    apiUrl: string;
    apiKey?: string;
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
