import type {
  SlotWireConfig,
  ContentBlueprint,
  BlueprintItem,
  ArchetypeDefinition,
  ArchetypeSlotDefinition,
} from './types.js';

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
export function generateBlueprint(
  config: SlotWireConfig,
  archetypeKey: string,
  options: GenerateBlueprintOptions
): ContentBlueprint {
  const {
    targetSlug,
    targetTitle = targetSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    template,
    addToMenu,
    menuKey = 'header_main',
    menuLabel,
    menuOrder = 20,
    parentSlug,
    customData = {},
  } = options;

  const archetype: ArchetypeDefinition = config.archetypes?.[archetypeKey] || {
    name: archetypeKey,
    collection: 'pages',
    template: template || 'standard',
    slots: {},
    description: `Default archetype for ${archetypeKey}`,
  };

  const items: BlueprintItem[] = [];
  const selectedTemplate = template || archetype.template || 'standard';

  // 1. Root Master Page Record
  const rootCollection = archetype.collection || 'pages';
  items.push({
    id: `draft-${targetSlug}`,
    collection: rootCollection,
    action: 'create',
    pageSlug: targetSlug,
    slotKey: 'root_page',
    depth: 0,
    description: `Master Page Container (${rootCollection}: '${targetSlug}')`,
    data: {
      slug: targetSlug,
      title: targetTitle,
      template: selectedTemplate,
      status: 'draft',
      ...customData,
    },
  });

  // 2. Navigation Menu Record (if addToMenu is requested)
  if (addToMenu) {
    const navCollection = config.navigation?.collection || 'site_navigation';
    const label = menuLabel || targetTitle;
    items.push({
      id: `draft-nav-${targetSlug}`,
      collection: navCollection,
      action: 'create',
      pageSlug: targetSlug,
      slotKey: 'site_navigation',
      depth: 0,
      description: `Navigation Menu Item (${navCollection}: '${label}' -> '/${targetSlug}')`,
      data: {
        title: label,
        slug: `nav-${targetSlug}`,
        link: `/${targetSlug}`,
        menuKey,
        parentSlug,
        order: menuOrder,
        enabled: true,
        status: 'draft',
      },
    });
  }

  // 3. Process Slots & Nested Hierarchies
  for (const [slotKey, slotDef] of Object.entries(archetype.slots)) {
    processSlotDefinition(slotDef, slotKey, targetSlug, targetTitle, items, 1, 'root_page');
  }

  const totalToCreate = items.filter((i) => i.action === 'create').length;
  const totalToReuse = items.filter((i) => i.action === 'reference').length;

  return {
    archetypeKey,
    targetSlug,
    targetTitle,
    items,
    totalToCreate,
    totalToReuse,
    generatedAt: new Date().toISOString(),
  };
}

function processSlotDefinition(
  slotDef: ArchetypeSlotDefinition,
  slotKey: string,
  pageSlug: string,
  pageTitle: string,
  items: BlueprintItem[],
  depth: number,
  parentKey: string
) {
  const sectionKey = slotDef.key || slotKey;
  const isReference =
    slotDef.strategy === 'reference' ||
    slotDef.strategy === 'reuse_shared' ||
    slotDef.kind === 'reference' ||
    slotDef.kind === 'singleton';

  if (isReference) {
    items.push({
      id: `ref-${slotDef.collection}-${sectionKey}`,
      collection: slotDef.collection,
      action: 'reference',
      pageSlug,
      sectionKey,
      slotKey,
      depth,
      parentKey,
      description: `Shared Content Reference (${slotDef.collection})`,
      data: {
        filter: slotDef.defaultFilter || { featured: true },
        reusedCollection: slotDef.collection,
      },
    });
    return;
  }

  // Cascade creation for sections/containers
  const sectionItemId = `draft-${pageSlug}-${sectionKey}`;
  items.push({
    id: sectionItemId,
    collection: slotDef.collection || 'page_sections',
    action: 'create',
    pageSlug,
    sectionKey,
    slotKey,
    depth,
    parentKey,
    description: `Section Slot (${slotDef.collection || 'page_sections'}: '${sectionKey}')`,
    data: {
      pageSlug,
      sectionKey,
      title: `${pageTitle} ${sectionKey.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
      status: 'draft',
      order: depth * 10,
      ...slotDef.defaultData,
    },
  });

  // Cascade creation for children (e.g. multi-card bento grids)
  if (slotDef.children) {
    for (const [childKey, childDef] of Object.entries(slotDef.children)) {
      const count = childDef.defaultCount || childDef.minItems || 3;
      for (let i = 1; i <= count; i++) {
        const cardSlug = `${pageSlug}-${sectionKey}-item-${i}`;
        items.push({
          id: `draft-${cardSlug}`,
          collection: childDef.collection || 'feature_cards',
          action: 'create',
          pageSlug,
          sectionKey,
          slotKey: childKey,
          depth: depth + 1,
          parentKey: sectionItemId,
          description: `Child Item #${i} (${childDef.collection || 'feature_cards'})`,
          data: {
            pageSlug,
            sectionKey,
            slug: cardSlug,
            title: `Feature Item ${i}`,
            summary: `Summary placeholder for ${cardSlug}`,
            colSpan: i === 1 ? 2 : 1,
            order: i * 10,
            status: 'draft',
            ...childDef.defaultData,
          },
        });
      }
    }
  }
}
