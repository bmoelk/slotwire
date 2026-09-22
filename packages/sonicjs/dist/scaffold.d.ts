import type { SlotDefinition, FieldDefinition, SlotWireConfig } from '@slotwire/core';
export declare function fieldDefinitionToSonicSchema(field: FieldDefinition): Record<string, any>;
export declare function generateSonicCollectionConfig(slotKey: string, slotDef: SlotDefinition): any;
export declare function generateSonicTicketCollectionConfig(): any;
export declare function generateSonicNavigationCollectionConfig(config?: SlotWireConfig): any;
export declare function scaffoldAllSonicCollections(config: SlotWireConfig): any[];
export interface SonicScaffoldOptions {
    cmsApiUrl?: string;
    apiKey?: string;
    d1?: any;
    targetEnv?: string;
}
/**
 * Atomically scaffolds all draft records defined by a ContentBlueprint
 * into the SonicJS D1 database or via SonicJS REST API.
 */
export declare function scaffoldBlueprint(blueprint: any, options?: SonicScaffoldOptions): Promise<any>;
//# sourceMappingURL=scaffold.d.ts.map