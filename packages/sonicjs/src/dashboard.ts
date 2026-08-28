import type { SlotWireConfig } from '@slotwire/core';
import { exportContractToJson } from '@slotwire/core';

export interface DashboardOptions {
  config: SlotWireConfig;
  stagingUrl?: string;
  productionUrl?: string;
  currentHost?: string;
}

export function renderSlotWireDashboard(options: DashboardOptions): string {
  const { config, stagingUrl = 'https://brainendeavor-staging.pages.dev', productionUrl = 'https://brainendeavor.com' } = options;
  const jsonContract = exportContractToJson(config);
  
  const slotsList = Object.entries(config.slots).map(([key, def]) => {
    const collName = def.kind === 'collection' ? def.collectionName : key;
    const pattern = (def as any).previewRoutePattern || (def as any).previewRoute;
    const patternDesc = typeof pattern === 'function' ? 'Dynamic: (doc) => route' : (pattern || '/');
    return { key, collName, kind: def.kind, pattern: patternDesc };
  });

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SlotWire Control Center | SonicJS CMS</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' };</script>
  <style>
    :root {
      --bg: #070a12;
      --card: #0e1526;
      --card-alt: #131c31;
      --border: rgba(255, 255, 255, 0.08);
      --emerald: #10b981;
      --emerald-bg: rgba(16, 185, 129, 0.12);
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #070a12; color: #f8fafc; }
  </style>
</head>
<body class="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between">
  <!-- Top Bar -->
  <header class="sticky top-0 z-50 bg-[#0b1120]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <a href="/admin" class="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mr-2">
        &larr; Admin Dashboard
      </a>
      <span class="text-white/20">|</span>
      <div class="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#10b981" stroke-width="1.8"/>
          <rect x="16" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#06b6d4" stroke-width="1.8"/>
          <circle cx="5" cy="8.5" r="1.2" fill="#10b981"/>
          <circle cx="5" cy="15.5" r="1.2" fill="#10b981"/>
          <circle cx="19" cy="8.5" r="1.2" fill="#06b6d4"/>
          <circle cx="19" cy="15.5" r="1.2" fill="#06b6d4"/>
          <path d="M6.5 8.5H17.5" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M6.5 15.5H17.5" stroke="#06b6d4" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <h1 class="text-sm font-bold text-white tracking-tight">SlotWire Control Center</h1>
        <p class="text-[11px] text-slate-400">Headless Contract Bridge & Deployment Manager</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
        <span class="size-1.5 rounded-full bg-emerald-400"></span> Active Bridge
      </span>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-6xl mx-auto px-6 py-8 w-full flex-grow">
    <!-- Section 1: Environments & 1-Click Deployment -->
    <div class="mb-10">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-400">⚡ Environments & Deployments</h2>
        <span id="global-status" class="text-xs text-slate-400"></span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Staging Card -->
        <div class="rounded-xl bg-[#0e1526] border border-emerald-500/30 p-5 shadow-lg relative overflow-hidden">
          <div class="flex items-start justify-between mb-4">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Staging</span>
              <h3 class="text-lg font-bold text-white mt-2">Cloudflare Pages Staging</h3>
              <a href="${stagingUrl}" target="_blank" class="text-xs text-sky-400 hover:underline flex items-center gap-1 mt-0.5">
                ${stagingUrl} &nearr;
              </a>
            </div>
            <span id="staging-probe" class="text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-white/10 text-slate-400">
              Probing...
            </span>
          </div>

          <p class="text-xs text-slate-400 mb-6 leading-relaxed">
            Fast edge deployment used for QA, editorial review, and pre-release validation. Pulls content from SonicJS on rebuild.
          </p>

          <div class="flex items-center justify-between pt-4 border-t border-white/10">
            <span id="staging-last-deploy" class="text-[11px] text-slate-500">Ready to trigger</span>
            <button
              id="deploy-staging-btn"
              onclick="triggerDeploy('staging')"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer"
            >
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <span>Deploy to Staging</span>
            </button>
          </div>
        </div>

        <!-- Production Card -->
        <div class="rounded-xl bg-[#0e1526] border border-white/10 p-5 shadow-lg relative overflow-hidden">
          <div class="flex items-start justify-between mb-4">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Production</span>
              <h3 class="text-lg font-bold text-white mt-2">Cloudflare Pages Production</h3>
              <a href="${productionUrl}" target="_blank" class="text-xs text-sky-400 hover:underline flex items-center gap-1 mt-0.5">
                ${productionUrl} &nearr;
              </a>
            </div>
            <span id="production-probe" class="text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-white/10 text-slate-400">
              Probing...
            </span>
          </div>

          <p class="text-xs text-slate-400 mb-6 leading-relaxed">
            Live public web property. Triggers a full production build and global edge CDN cache purge.
          </p>

          <div class="flex items-center justify-between pt-4 border-t border-white/10">
            <span id="production-last-deploy" class="text-[11px] text-slate-500">Ready to trigger</span>
            <button
              id="deploy-production-btn"
              onclick="confirmProductionDeploy()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
            >
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Deploy to Production</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Active Contract Matrix -->
    <div class="mb-10">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">⚙️ Active Contract Slots Matrix</h2>
          <p class="text-xs text-slate-500">Declared in <code>slotwire.config.ts</code> mapping SonicJS collections to Astro routes.</p>
        </div>
        <button onclick="toggleJson()" id="json-toggle-btn" class="px-3 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-white/10">
          { } View JSON Schema
        </button>
      </div>

      <div id="slots-table" class="rounded-xl border border-white/10 bg-[#0e1526] overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-black/30 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
              <th class="py-3 px-4">Contract Slot</th>
              <th class="py-3 px-4">CMS Collection</th>
              <th class="py-3 px-4">Type</th>
              <th class="py-3 px-4">Astro Route Pattern</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 font-mono">
            ${slotsList.map(s => `
              <tr class="hover:bg-white/[0.02] transition-colors">
                <td class="py-3 px-4 font-bold text-emerald-400">${s.key}</td>
                <td class="py-3 px-4 text-slate-300">${s.collName}</td>
                <td class="py-3 px-4 text-slate-400 capitalize">${s.kind}</td>
                <td class="py-3 px-4 text-sky-400">${s.pattern}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div id="json-schema-view" class="hidden mt-3 rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto whitespace-pre">
${JSON.stringify(jsonContract, null, 2)}
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-white/10 bg-black/40 py-4 px-6 text-center text-xs text-slate-500">
    <p>SlotWire &bull; Universal Headless CMS Bridge &bull; Cloudflare Workers Edge Integration</p>
  </footer>

  <!-- Toast Notification Container -->
  <div id="toast" class="fixed bottom-6 right-6 z-50 hidden rounded-lg border border-emerald-500/40 bg-slate-900 p-4 text-xs font-semibold text-emerald-300 shadow-2xl transition-all">
    <span id="toast-msg">Deploy hook dispatched</span>
  </div>

  <script>
    async function probeEnvs() {
      // Probe staging
      try {
        const t0 = performance.now();
        const res = await fetch('${stagingUrl}', { method: 'GET', mode: 'no-cors' });
        const ms = Math.round(performance.now() - t0);
        document.getElementById('staging-probe').innerHTML = '<span class="text-emerald-400">● Live (' + ms + 'ms)</span>';
      } catch (e) {
        document.getElementById('staging-probe').innerHTML = '<span class="text-amber-400">● Ready</span>';
      }

      // Probe production
      try {
        const t0 = performance.now();
        const res = await fetch('${productionUrl}', { method: 'GET', mode: 'no-cors' });
        const ms = Math.round(performance.now() - t0);
        document.getElementById('production-probe').innerHTML = '<span class="text-emerald-400">● Live (' + ms + 'ms)</span>';
      } catch (e) {
        document.getElementById('production-probe').innerHTML = '<span class="text-amber-400">● Ready</span>';
      }
    }

    async function triggerDeploy(target) {
      const btn = document.getElementById('deploy-' + target + '-btn');
      const origText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin mr-1">↻</span> Dispatching...';

      try {
        const res = await fetch('/admin/api/slotwire/deploy?env=' + target, { method: 'POST' });
        const data = await res.json();
        
        if (res.ok && data.success) {
          showToast('🚀 Deploy to ' + target + ' triggered successfully! Cloudflare Pages build in progress.');
          document.getElementById(target + '-last-deploy').innerText = 'Triggered at ' + new Date().toLocaleTimeString();
        } else {
          showToast('❌ Deploy failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        showToast('❌ Network error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }

    function confirmProductionDeploy() {
      if (confirm("Are you sure you want to trigger a full PRODUCTION rebuild on brainendeavor.com?")) {
        triggerDeploy('production');
      }
    }

    function showToast(msg) {
      const el = document.getElementById('toast');
      document.getElementById('toast-msg').innerText = msg;
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 5000);
    }

    function toggleJson() {
      const el = document.getElementById('json-schema-view');
      const btn = document.getElementById('json-toggle-btn');
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        btn.innerText = 'Hide JSON Schema';
      } else {
        el.classList.add('hidden');
        btn.innerText = '{ } View JSON Schema';
      }
    }

    probeEnvs();
  </script>
</body>
</html>`;
}
