import type { ScanResult } from './scanner.js';

export function formatConsoleReport(result: ScanResult, options: { strict?: boolean } = {}): string {
  const lines: string[] = [];
  const pct = result.totalSlots > 0
    ? Math.round((result.populatedSlots / result.totalSlots) * 100)
    : 100;

  lines.push('');
  lines.push('\x1b[38;2;16;185;129m⚡ SlotWire Automated Site Audit & Blueprint Matrix\x1b[0m');
  lines.push('───────────────────────────────────────────────────────────────────────');
  lines.push(`Target Directory:   ${result.targetDir}`);
  lines.push(`Audited Routes:     ${result.totalRoutes}`);
  lines.push(`Total Visual Slots: ${result.totalSlots} (${result.populatedSlots} Populated, ${result.ghostSlots} Ghost Slots)`);
  lines.push(`Site Completeness:  \x1b[1m${pct}%\x1b[0m`);
  lines.push('───────────────────────────────────────────────────────────────────────');
  lines.push('');

  if (result.routes.length === 0) {
    lines.push('\x1b[33mNo routes with SlotWire declarations were discovered in target directory.\x1b[0m');
    lines.push('');
    return lines.join('\n');
  }

  // Table Header
  lines.push('Route                      Total   Populated   Ghost   Completeness');
  lines.push('───────────────────────────────────────────────────────────────────────');

  for (const r of result.routes) {
    const routeCol = r.route.padEnd(26).substring(0, 26);
    const totalCol = String(r.totalSlots).padEnd(8);
    const popCol = String(r.populatedSlots).padEnd(12);
    const ghostCol = String(r.ghostSlots).padEnd(8);
    const statusCol = r.isComplete
      ? '\x1b[32m[✓ 100%]\x1b[0m'
      : `\x1b[33m[⚠️ ${Math.round((r.populatedSlots / r.totalSlots) * 100)}%]\x1b[0m`;

    lines.push(`${routeCol} ${totalCol} ${popCol} ${ghostCol} ${statusCol}`);

    // If ghost slots are present, list them
    if (r.ghostSlots > 0) {
      for (const s of r.slots.filter((item) => item.isGhost)) {
        lines.push(`  \x1b[31m↳ Missing Slot: '${s.slot}' (${s.collection || 'unmapped'})\x1b[0m`);
      }
    }
  }

  lines.push('───────────────────────────────────────────────────────────────────────');

  if (result.isClean) {
    lines.push('\x1b[32m✔ PRE-DEPLOY QUALITY GATE PASSED: 100% of required visual slots are populated.\x1b[0m');
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
