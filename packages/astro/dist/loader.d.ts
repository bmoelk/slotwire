import type { SlotwireLoaderOptions } from '@slotwire/core';
export interface AstroLoaderContext {
    store: {
        set: (entry: {
            id: string;
            data: Record<string, any>;
            digest?: string;
            rendered?: any;
        }) => void;
        get?: (id: string) => any;
        entries?: () => [string, any][];
        delete?: (id: string) => void;
        clear?: () => void;
    };
    logger?: {
        info: (msg: string) => void;
        warn: (msg: string) => void;
        error: (msg: string) => void;
        debug?: (msg: string) => void;
    };
    parseData?: (entry: {
        id: string;
        data: Record<string, any>;
    }) => Promise<any> | any;
    generateDigest?: (data: any) => string;
    meta?: Map<string, any>;
}
/**
 * Universal Astro 5 Content Layer Loader for SlotWire.
 * Connects directly to any configured headless CMS (Directus, SlottD, WordPress, SonicJS)
 * and automatically infers schema validation from slotwire.config.ts.
 */
export declare function slotwireLoader(options: SlotwireLoaderOptions): {
    name: string;
    schema: (() => import("zod").ZodTypeAny) | undefined;
    load(context: AstroLoaderContext): Promise<void>;
};
//# sourceMappingURL=loader.d.ts.map