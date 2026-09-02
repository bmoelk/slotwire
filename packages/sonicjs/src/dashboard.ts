import type { SlotWireConfig } from '@slotwire/core';
import { exportContractToJson } from '@slotwire/core';

export interface DashboardOptions {
  config: SlotWireConfig;
  stagingUrl?: string;
  productionUrl?: string;
  currentHost?: string;
  embedded?: boolean;
}

export function renderSlotWireDashboard(options: DashboardOptions): string {
  const {
    config,
    stagingUrl = 'https://staging.example.com',
    productionUrl = 'https://example.com',
    embedded = true,
  } = options;
  const jsonContract = exportContractToJson(config);
  
  const slotsList = Object.entries(config.slots).map(([key, def]) => {
    const collName = def.kind === 'collection' ? def.collectionName : key;
    const pattern = (def as any).previewRoutePattern || (def as any).previewRoute;
    const patternDesc = typeof pattern === 'function' ? 'Dynamic: (doc) => route' : (pattern || '/');
    return { key, collName, kind: def.kind, pattern: patternDesc };
  });

  const bodyContent = `
  <div class="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
    <!-- Header Banner -->
    <div class="rounded-2xl bg-gradient-to-r from-[#0b1120] via-[#0f172a] to-[#0b1120] border border-white/10 p-6 shadow-xl relative overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="size-12 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-white tracking-tight">SlotWire</h1>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <span class="size-1.5 rounded-full bg-emerald-400"></span> Active Bridge
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Unified schema contracts, dynamic draft preview, and 1-click deployments for Astro &amp; SonicJS</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <a href="/admin/plugins/slotwire" class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition-colors">
            <svg class="size-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Plugin Settings
          </a>
        </div>
      </div>
    </div>

    <!-- Section 1: Environments & 1-Click Deployment -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-400">⚡ Environments &amp; Deployments</h2>
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
            Fast edge deployment used for QA, editorial review, and pre-release validation. Pulls live content from SonicJS on rebuild.
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
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">⚙️ Active Contract Slots Matrix</h2>
          <p class="text-xs text-slate-500">Declared in <code class="text-emerald-400">slotwire.config.ts</code> mapping SonicJS collections to Astro routes.</p>
        </div>
        <button onclick="toggleJson()" id="json-toggle-btn" class="px-3 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-white/10 cursor-pointer">
          { } View JSON Schema
        </button>
      </div>

      <div id="slots-table" class="rounded-xl border border-white/10 bg-[#0e1526] overflow-hidden shadow-lg">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-black/40 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
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
  </div>

    <!-- Section 3: Persistent Activity & Diagnostics Console -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">📡 Activity &amp; Diagnostics Console</h2>
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Persistent Log
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick="copyConsoleLogs()"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition-colors cursor-pointer"
            title="Copy entire log to clipboard for review or support"
          >
            <svg class="size-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
            <span id="copy-log-btn-text">Copy Log</span>
          </button>
          <button
            type="button"
            onclick="clearConsoleLogs()"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-400 hover:text-red-300 border border-white/10 transition-colors cursor-pointer"
            title="Clear console output history"
          >
            <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Clear
          </button>
        </div>
      </div>

      <div class="rounded-xl border border-white/10 bg-[#070a12] p-4 shadow-xl overflow-hidden">
        <div id="console-output" class="max-h-72 min-h-[160px] overflow-y-auto space-y-2 font-mono text-xs text-slate-300 leading-relaxed pr-2">
          <!-- Dynamically populated log entries -->
        </div>
      </div>
    </div>
  </div>

  <script>
    const LOG_STORAGE_KEY = 'slotwire_diagnostics_logs';

    function getSavedLogs() {
      try {
        const raw = localStorage.getItem(LOG_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveLogs(logs) {
      try {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(-100)));
      } catch (e) {}
    }

    function appendLog(level, message, details = null) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const entry = { time: timeStr, level, message, details, id: Date.now() + Math.random() };

      const logs = getSavedLogs();
      logs.push(entry);
      saveLogs(logs);
      renderLogEntry(entry, true);
    }

    function renderLogEntry(entry, autoScroll = true) {
      const container = document.getElementById('console-output');
      if (!container) return;

      const levelColors = {
        ERROR: 'bg-red-950/80 text-red-300 border-red-800/60',
        SUCCESS: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
        INFO: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
        WARN: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
      };

      const badgeClass = levelColors[entry.level] || levelColors.INFO;

      const row = document.createElement('div');
      row.className = 'flex flex-col gap-1 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors';
      row.innerHTML = \`
        <div class="flex items-start gap-2">
          <span class="text-zinc-500 shrink-0">[\${entry.time}]</span>
          <span class="px-1.5 py-0.2 rounded text-[10px] font-bold tracking-wider uppercase border shrink-0 \${badgeClass}">\${entry.level}</span>
          <span class="text-slate-200 break-words flex-1">\${entry.message}</span>
        </div>
        \${entry.details ? \`<pre class="mt-1 p-2 bg-black/40 rounded border border-white/5 text-[11px] text-zinc-400 overflow-x-auto whitespace-pre-wrap">\${entry.details}</pre>\` : ''}
      \`;

      container.appendChild(row);

      if (autoScroll) {
        container.scrollTop = container.scrollHeight;
      }
    }

    function renderAllLogs() {
      const container = document.getElementById('console-output');
      if (!container) return;
      container.innerHTML = '';
      const logs = getSavedLogs();

      if (logs.length === 0) {
        appendLog('INFO', 'SlotWire bridge online. Ready to trigger Cloudflare deployments and probe edge environments.');
      } else {
        logs.forEach(l => renderLogEntry(l, false));
        container.scrollTop = container.scrollHeight;
      }
    }

    function clearConsoleLogs() {
      localStorage.removeItem(LOG_STORAGE_KEY);
      const container = document.getElementById('console-output');
      if (container) container.innerHTML = '';
      appendLog('INFO', 'Console log history cleared.');
    }

    function copyConsoleLogs() {
      const logs = getSavedLogs();
      const text = logs.map(l => \`[\${l.time}] [\${l.level}] \${l.message}\${l.details ? '\\nDetails:\\n' + l.details : ''}\`).join('\\n\\n');
      
      navigator.clipboard.writeText(text).then(() => {
        const btnText = document.getElementById('copy-log-btn-text');
        if (btnText) {
          const orig = btnText.innerText;
          btnText.innerText = 'Copied!';
          setTimeout(() => { btnText.innerText = orig; }, 2000);
        }
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }

    async function probeEnvs() {
      // Probe staging
      try {
        const t0 = performance.now();
        await fetch('${stagingUrl}', { method: 'GET', mode: 'no-cors' });
        const ms = Math.round(performance.now() - t0);
        const el = document.getElementById('staging-probe');
        if (el) el.innerHTML = '<span class="text-emerald-400">● Live (' + ms + 'ms)</span>';
      } catch (e) {
        const el = document.getElementById('staging-probe');
        if (el) el.innerHTML = '<span class="text-amber-400">● Ready</span>';
      }

      // Probe production
      try {
        const t0 = performance.now();
        await fetch('${productionUrl}', { method: 'GET', mode: 'no-cors' });
        const ms = Math.round(performance.now() - t0);
        const el = document.getElementById('production-probe');
        if (el) el.innerHTML = '<span class="text-emerald-400">● Live (' + ms + 'ms)</span>';
      } catch (e) {
        const el = document.getElementById('production-probe');
        if (el) el.innerHTML = '<span class="text-amber-400">● Ready</span>';
      }
    }

    async function triggerDeploy(target) {
      const btn = document.getElementById('deploy-' + target + '-btn');
      if (!btn) return;
      const origText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin mr-1">↻</span> Dispatching...';

      appendLog('INFO', \`Dispatching 1-click deployment trigger for \${target.toUpperCase()}...\`);

      try {
        const res = await fetch('/admin/api/slotwire/deploy?env=' + target, { method: 'POST' });
        const data = await res.json();
        
        if (res.ok && data.success) {
          const successMsg = \`🚀 Deployment to \${target.toUpperCase()} successfully triggered (HTTP \${res.status}). Cloudflare Pages build in progress.\`;
          appendLog('SUCCESS', successMsg, JSON.stringify(data, null, 2));

          const lastEl = document.getElementById(target + '-last-deploy');
          if (lastEl) {
            lastEl.innerHTML = \`<span class="text-emerald-400 font-semibold">● Triggered at \${new Date().toLocaleTimeString()}</span>\`;
          }
        } else {
          const errMsg = data.error || \`HTTP \${res.status} error from deployment endpoint\`;
          appendLog('ERROR', \`Deploy to \${target.toUpperCase()} failed: \${errMsg}\`, JSON.stringify(data, null, 2));

          const lastEl = document.getElementById(target + '-last-deploy');
          if (lastEl) {
            lastEl.innerHTML = \`<span class="text-red-400 font-semibold">● Failed at \${new Date().toLocaleTimeString()}</span>\`;
          }
        }
      } catch (err) {
        appendLog('ERROR', \`Network error communicating with /admin/api/slotwire/deploy: \${err.message}\`);
      } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }

    function confirmProductionDeploy() {
      if (confirm("Are you sure you want to trigger a full PRODUCTION rebuild?")) {
        triggerDeploy('production');
      }
    }

    function toggleJson() {
      const el = document.getElementById('json-schema-view');
      const btn = document.getElementById('json-toggle-btn');
      if (!el || !btn) return;
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        btn.innerText = 'Hide JSON Schema';
      } else {
        el.classList.add('hidden');
        btn.innerText = '{ } View JSON Schema';
      }
    }

    probeEnvs();
    renderAllLogs();
  </script>
  `;

  if (embedded) {
    return bodyContent;
  }

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SlotWire | SonicJS CMS</title>
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
      <div class="size-8 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-center justify-center shadow-inner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <h1 class="text-sm font-bold text-white tracking-tight">SlotWire</h1>
        <p class="text-[11px] text-slate-400">Headless CMS & Frontend Bridge</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
        <span class="size-1.5 rounded-full bg-emerald-400"></span> Active Bridge
      </span>
    </div>
  </header>

  <main class="max-w-6xl mx-auto w-full flex-grow">
    ${bodyContent}
  </main>

  <footer class="border-t border-white/10 bg-black/40 py-4 px-6 text-center text-xs text-slate-500">
    <p>SlotWire &bull; Universal Headless CMS Bridge &bull; Cloudflare Workers Edge Integration</p>
  </footer>
</body>
</html>`;
}

