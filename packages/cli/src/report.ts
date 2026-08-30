import type { ScanResult } from './scanner.js';

export function formatConsoleReport(result: ScanResult, options: { strict?: boolean } = {}): string {
  const lines: string[] = [];
  const pct = result.totalSlots > 0
    ? Math.round((result.cmsSlots / result.totalSlots) * 100)
    : 100;

  lines.push('');
  lines.push('\x1b[38;2;16;185;129m⚡ SlotWire Content Completeness & Blueprint Matrix\x1b[0m');
  lines.push('───────────────────────────────────────────────────────────────────────');
  lines.push(`Audit Target:       ${result.auditTarget}`);
  if (result.cmsApiUrl) {
    lines.push(`Configured CMS API: ${result.cmsApiUrl}`);
  }
  lines.push(`Discovered Routes:  ${result.totalRoutes}`);
  lines.push(`Total Visual Slots: ${result.totalSlots} (${result.cmsSlots} Live CMS, ${result.fallbackSlots} Static Fallback, ${result.ghostSlots} Ghost Slots)`);
  lines.push(`Live CMS Coverage:  \x1b[1m${pct}%\x1b[0m`);
  lines.push('───────────────────────────────────────────────────────────────────────');
  lines.push('');

  if (result.routes.length === 0) {
    lines.push('\x1b[33mNo routes with SlotWire declarations were discovered in target directory.\x1b[0m');
    lines.push('');
    return lines.join('\n');
  }

  // Table Header
  lines.push('Route                      Total   Live CMS   Fallback   Ghost   Status');
  lines.push('───────────────────────────────────────────────────────────────────────');

  for (const r of result.routes) {
    const routeCol = r.route.padEnd(26).substring(0, 26);
    const totalCol = String(r.totalSlots).padEnd(7);
    const cmsCol = String(r.cmsSlots).padEnd(10);
    const fallbackCol = String(r.fallbackSlots).padEnd(10);
    const ghostCol = String(r.ghostSlots).padEnd(7);

    let statusCol = '\x1b[32m[✓ 100% CMS]\x1b[0m';
    if (r.ghostSlots > 0) {
      statusCol = `\x1b[31m[✖ ${r.ghostSlots} Missing]\x1b[0m`;
    } else if (r.fallbackSlots > 0) {
      statusCol = `\x1b[33m[⚠️ ${r.fallbackSlots} Fallback]\x1b[0m`;
    }

    lines.push(`${routeCol} ${totalCol} ${cmsCol} ${fallbackCol} ${ghostCol} ${statusCol}`);

    // If ghost slots or fallbacks are present, list them
    if (r.ghostSlots > 0) {
      for (const s of r.slots.filter((item) => item.isGhost)) {
        lines.push(`  \x1b[31m↳ Missing Ghost Slot: '${s.slot}' (${s.collection || 'unmapped'})\x1b[0m`);
      }
    }
    if (r.fallbackSlots > 0) {
      for (const s of r.slots.filter((item) => item.source === 'fallback')) {
        lines.push(`  \x1b[33m↳ Static Fallback Used: '${s.slot}' (no CMS record found)\x1b[0m`);
      }
    }
  }

  lines.push('───────────────────────────────────────────────────────────────────────');

  if (result.isClean) {
    lines.push('\x1b[32m✔ PRE-DEPLOY QUALITY GATE PASSED: 100% of visual slots are populated from CMS records.\x1b[0m');
  } else {
    lines.push('\x1b[31m✖ PRE-DEPLOY QUALITY GATE FAILED:\x1b[0m');
    for (const err of result.errors) {
      lines.push(`  • ${err}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

export function exportJsonReport(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}
