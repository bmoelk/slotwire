import type { SlotWireConfig, ContentBlueprint } from './types.js';
export interface GenerateBlueprintOptions {
    targetSlug: string;
    targetTitle?: string;
    template?: string;
    addToMenu?: boolean;
    menuKey?: string;
    menuLabel?: string;
    menuOrder?: number;
    parentSlug?: string;
    customData?: Record<string, any>;
}
/**
 * Deterministically generates a ContentBlueprint from an Archetype definition,
 * calculating all cascade creations, navigation placement, and shared content references.
 */
export declare function generateBlueprint(config: SlotWireConfig, archetypeKey: string, options: GenerateBlueprintOptions): ContentBlueprint;
//# sourceMappingURL=blueprint.d.ts.map