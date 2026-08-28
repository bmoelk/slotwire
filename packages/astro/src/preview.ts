import type { SlotWireConfig } from '@slotwire/core';
import { resolvePreviewRoute, exportContractToJson } from '@slotwire/core';

export interface PreviewHandlerOptions {
  config: SlotWireConfig;
  secretParam?: string;
  cookieName?: string;
}

export function createPreviewHandler(options: PreviewHandlerOptions) {
  const { config, secretParam = 'secret', cookieName = 'slotwire_preview' } = options;

  return async ({ request, cookies, redirect }: { request: Request; cookies: any; redirect: (url: string) => Response }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get(secretParam);
    const slot = url.searchParams.get('slot') || url.searchParams.get('collection') || '';
    const slug = url.searchParams.get('slug') || url.searchParams.get('id') || '';
    const disable = url.searchParams.get('disable');

    if (disable) {
      cookies.delete(cookieName, { path: '/' });
      return redirect('/');
    }

    const envSecret = (globalThis as any).process?.env?.SLOTWIRE_PREVIEW_SECRET;
    const expectedSecret = config.cms.previewSecret || envSecret || 'dev-preview-secret';
    if (token !== expectedSecret) {
      return new Response('Unauthorized: Invalid SlotWire preview secret', { status: 401 });
    }

    // Set preview cookie
    cookies.set(cookieName, 'true', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours
    });

    // 1. Direct Live Draft Rendering Mode
    const viewMode = url.searchParams.get('view');
    if (viewMode === 'live') {
      try {
        const primaryApi = config.cms.apiUrl || 'https://cms.brainendeavor.com';
        const fallbackApi = 'https://brainendeavor-cms.bmoelk.workers.dev';
        const queryPath = `/api/collections/${encodeURIComponent(slot || 'blog_post')}/content?filter[data.slug][equals]=${encodeURIComponent(slug || 'data-migration-strategies')}&_t=${Date.now()}`;
        
        let apiRes = await fetch(`${primaryApi}${queryPath}`, { cache: 'no-store' }).catch(() => null);
        if (!apiRes || !apiRes.ok) {
          apiRes = await fetch(`${fallbackApi}${queryPath}`, { cache: 'no-store' }).catch(() => null);
        }

        let postData: any = null;
        if (apiRes && apiRes.ok) {
          const json: any = await apiRes.json();
          postData = json.data?.[0];
        }

        if (postData && postData.data) {
          let rawContent = postData.data.content || '';
          rawContent = rawContent.replace(/^\s*import\s+[^\r\n]+;?\r?$/gm, '');
          
          // Simple markdown converter
          let bodyHtml = rawContent
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold font-serif text-zinc-900 dark:text-zinc-100 mt-8 mb-4">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-100 mt-10 mb-4">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-100 mt-12 mb-6">$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/```ts([\s\S]*?)```/gim, '<pre class="bg-zinc-900 text-zinc-100 p-4 rounded-lg my-4 overflow-x-auto text-xs font-mono"><code>$1</code></pre>')
            .replace(/```([\s\S]*?)```/gim, '<pre class="bg-zinc-900 text-zinc-100 p-4 rounded-lg my-4 overflow-x-auto text-xs font-mono"><code>$1</code></pre>')
            .replace(/<Admonition\s+variant="([^"]+)">([\s\S]*?)<\/Admonition>/gim, (_m: string, v: string, inner: string) => {
              const variant = v.toLowerCase();
              const border = variant === 'tip' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' :
                             variant === 'caution' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-sky-500 bg-sky-500/10 text-sky-300';
              return `<div class="my-6 rounded-r-lg border-l-4 p-4 ${border}"><div class="font-bold text-xs uppercase mb-1">${variant}</div>${inner.trim()}</div>`;
            })
            .replace(/\n\n/gim, '</p><p class="my-4 leading-relaxed text-zinc-700 dark:text-zinc-300">');

          const categoriesList = typeof postData.data.categories === 'string'
            ? postData.data.categories.split(',').map((c: string) => c.trim()).filter(Boolean)
            : (Array.isArray(postData.data.categories) ? postData.data.categories : ['Engineering', 'Architecture']);

          const liveHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${postData.data.title || postData.title} | BrainEndeavor</title>
  <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#eef2ff',
              500: '#6366f1',
              600: '#4f46e5',
            }
          }
        }
      }
    };
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #070a12; color: #f1f5f9; }
    h1, h2, h3, .font-serif { font-family: 'Cinzel', serif; }
  </style>
</head>
<body class="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30">
  <!-- Live Preview Floating Header Bar -->
  <header class="sticky top-0 z-50 backdrop-blur-md bg-[#0b1120]/80 border-b border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <a href="/" class="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <span class="text-emerald-400 font-serif">⚡</span> BrainEndeavor
        </a>
        <nav class="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a href="/#services" class="hover:text-white transition-colors">Services</a>
          <a href="/#technology" class="hover:text-white transition-colors">Technology</a>
          <a href="/blog" class="text-emerald-400 font-medium">Blog</a>
          <a href="/about" class="hover:text-white transition-colors">About</a>
          <a href="/contact" class="hover:text-white transition-colors">Contact</a>
        </nav>
      </div>
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-pulse">
          <span class="size-1.5 rounded-full bg-emerald-400"></span> Live Preview (Draft)
        </span>
      </div>
    </div>
  </header>

  <!-- Main Article Layout -->
  <main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
    <article class="max-w-4xl mx-auto">
      <!-- Categories & Metadata -->
      <div class="flex flex-wrap items-center justify-center gap-2 mb-6">
        ${categoriesList.map((cat: string) => `
          <span class="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
            ${cat}
          </span>
        `).join('')}
      </div>

      <!-- Title -->
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-center text-white leading-tight mb-6">
        ${postData.data.title || postData.title}
      </h1>

      <!-- Author Row -->
      <div class="flex items-center justify-center gap-4 text-xs text-slate-400 mb-10 pb-6 border-b border-white/10">
        <div class="flex items-center gap-2">
          <div class="size-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300">
            BM
          </div>
          <span class="text-slate-200 font-medium">Brian Moelk</span>
        </div>
        <span>&bull;</span>
        <time datetime="${new Date().toISOString()}">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
        <span>&bull;</span>
        <span class="text-emerald-400">5 min read</span>
      </div>

      <!-- Hero Image -->
      <div class="rounded-2xl overflow-hidden mb-12 border border-white/10 shadow-2xl bg-slate-900">
        <img 
          src="${postData.data.heroImage || 'https://cms.brainendeavor.com/media/data-migration-hero.jpg'}" 
          alt="${postData.data.title || postData.title}" 
          class="w-full max-h-[460px] object-cover"
          onerror="this.style.display='none'"
        />
      </div>

      <!-- Article Body -->
      <div class="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed prose-headings:font-serif prose-headings:text-white prose-a:text-emerald-400 prose-code:text-emerald-300">
        <p class="leading-relaxed text-slate-300 text-lg">${bodyHtml}</p>
      </div>

      <!-- Author Bio Footer -->
      <div class="mt-16 p-6 rounded-xl bg-slate-900/60 border border-white/10 flex items-start gap-4">
        <div class="size-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-lg text-emerald-300 shrink-0">
          BM
        </div>
        <div>
          <h4 class="font-bold text-white text-sm">Brian Moelk</h4>
          <p class="text-xs text-slate-400 mt-1">Founder & Principal Systems Architect at BrainEndeavor. Specializing in high-performance distributed systems, edge runtimes, and headless CMS integrations.</p>
        </div>
      </div>
    </article>
  </main>

  <!-- Site Footer -->
  <footer class="mt-20 border-t border-white/10 bg-[#040711] py-8 text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-4">
      <p>&copy; ${new Date().getFullYear()} BrainEndeavor, LLC. All rights reserved. Live Preview Bridge &bull; Cloudflare Edge Runtime.</p>
    </div>
  </footer>
</body>
</html>`;
          return new Response(liveHtml, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          });
        }
      } catch (err: any) {
        return new Response(`Error rendering live draft: ${err.message}`, { status: 500 });
      }
    }

    // Resolve target route
    const resolvedPath = resolvePreviewRoute(config, slot, { slug, id: slug }) || '/';
    
    // Extract registered slots info for the contract explorer
    const registeredSlots = Object.entries(config.slots).map(([key, def]) => {
      const collName = def.kind === 'collection' ? def.collectionName : key;
      const pattern = (def as any).previewRoutePattern || (def as any).previewRoute;
      const patternDesc = typeof pattern === 'function' ? 'Dynamic: (doc) => route' : (pattern || '/');
      return { key, collName, kind: def.kind, pattern: patternDesc };
    });

    const isTokenValid = token === expectedSecret;
    const jsonContract = exportContractToJson(config);
    const livePreviewTarget = (slot === 'blog_post' || slot === 'blog_posts' || slot === 'blog-posts')
      ? `/api/preview?${secretParam}=${encodeURIComponent(token || '')}&collection=${encodeURIComponent(slot)}&slug=${encodeURIComponent(slug)}&view=live`
      : resolvedPath;

    const fullDestinationUrl = `${url.origin}${livePreviewTarget}`;
    const envLabel = url.hostname.includes('staging') 
      ? 'Staging' 
      : (url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1') ? 'Localhost' : 'Production');
    const envBadgeColor = envLabel === 'Production' ? 'badge-warning' : 'badge-success';

    // Render developer diagnostic workbench
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ SlotWire Preview Bridge & Diagnostics</title>
  <style>
    :root {
      --bg: #070a12;
      --card: #0e1526;
      --card-alt: #131c31;
      --border: rgba(255, 255, 255, 0.08);
      --text: #f8fafc;
      --muted: #94a3b8;
      --emerald: #10b981;
      --emerald-bg: rgba(16, 185, 129, 0.12);
      --indigo: #6366f1;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px 16px;
      line-height: 1.5;
    }
    .container { max-width: 1040px; margin: 0 auto; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      font-size: 24px;
      background: var(--emerald-bg);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 10px;
      border-radius: 8px;
    }
    .brand-title { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
    .brand-subtitle { font-size: 12px; color: var(--muted); }
    .header-badges { display: flex; align-items: center; gap: 8px; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-success { background: var(--emerald-bg); color: var(--emerald); border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-warning { background: rgba(245, 158, 11, 0.12); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-env { background: rgba(99, 102, 241, 0.12); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }
    .card-primary { border-color: rgba(16, 185, 129, 0.35); background: linear-gradient(180deg, #0e172a 0%, #0c1322 100%); }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--emerald);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .telemetry-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 14px; }
    .metric-box { background: var(--card-alt); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; }
    .metric-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .metric-value { font-family: ui-monospace, monospace; font-size: 13px; font-weight: 600; word-break: break-all; }
    .full-url-box { background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; }
    .full-url-text { font-family: ui-monospace, monospace; font-size: 12px; color: #38bdf8; word-break: break-all; }
    .btn-copy { background: var(--card-alt); border: 1px solid var(--border); color: var(--text); font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 5px; cursor: pointer; transition: all 0.15s; }
    .btn-copy:hover { background: rgba(255, 255, 255, 0.1); }
    .actions-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: var(--emerald); color: #042f2e; text-decoration: none; }
    .probe-badge { font-family: ui-monospace, monospace; font-size: 12px; padding: 4px 10px; border-radius: 6px; background: var(--card-alt); border: 1px solid var(--border); }
    .preview-frame-card { background: #000; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
    .frame-toolbar { background: var(--card-alt); padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; border-bottom: 1px solid var(--border); }
    iframe { width: 100%; height: 720px; border: none; background: #000; display: block; }
    .config-card { background: #090d16; border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; }
    .config-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
    .config-table th { text-align: left; padding: 6px 12px; color: var(--muted); border-bottom: 1px solid var(--border); font-size: 11px; text-transform: uppercase; }
    .config-table td { padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); font-family: ui-monospace, monospace; }
    .code-block { background: #040711; border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; font-family: ui-monospace, monospace; font-size: 11px; color: #94a3b8; max-height: 220px; overflow-y: auto; margin-top: 12px; white-space: pre; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="brand">
        <div class="brand-icon">⚡</div>
        <div>
          <h1 class="brand-title">SlotWire Preview Bridge & Diagnostics</h1>
          <p class="brand-subtitle">Reverse Route Resolver & Live Telemetry Inspector</p>
        </div>
      </div>
      <div class="header-badges">
        <div class="badge badge-env">
          <span>🌐</span> Env: <strong>${envLabel} (${url.host})</strong>
        </div>
        <div class="badge ${isTokenValid ? 'badge-success' : 'badge-warning'}">
          <span>●</span> ${isTokenValid ? 'Auth Verified' : 'Token Mismatch'}
        </div>
      </div>
    </header>

    <div class="card card-primary">
      <div class="card-header">
        <div class="card-title"><span>● Resolution Outcome</span></div>
        <span id="probe-status" class="probe-badge">Probing route...</span>
      </div>

      <div class="telemetry-grid">
        <div class="metric-box">
          <div class="metric-label">Target Route</div>
          <div class="metric-value" style="color: var(--emerald);">${livePreviewTarget}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Slot / Collection</div>
          <div class="metric-value">${slot || '(empty)'}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Document Slug / ID</div>
          <div class="metric-value">${slug || '(empty)'}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Active Environment</div>
          <div class="metric-value" style="color: #a5b4fc;">${envLabel}</div>
        </div>
      </div>

      <div class="full-url-box">
        <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
          <span style="font-size: 11px; color: var(--muted); text-transform: uppercase;">Full URL:</span>
          <span class="full-url-text" id="full-url-display">${fullDestinationUrl}</span>
        </div>
        <button class="btn-copy" onclick="copyFullUrl()" id="copy-btn">📋 Copy URL</button>
      </div>

      <div class="actions-row">
        <div style="font-size: 12px; color: var(--muted);">Raw Query: <code>${url.search || '(none)'}</code></div>
        <a href="${livePreviewTarget}" class="btn" target="_blank"><span>🚀 Open Full Window &rarr;</span></a>
      </div>
    </div>

    <div class="preview-frame-card">
      <div class="frame-toolbar">
        <div>Live In-Situ Preview: <code style="color: var(--emerald); font-weight: bold;">${livePreviewTarget}</code></div>
        <div id="latency-indicator" style="color: var(--muted); font-size: 11px;">Loading...</div>
      </div>
      <iframe id="preview-iframe" src="${livePreviewTarget}"></iframe>
    </div>

    <div class="config-card">
      <div class="card-header">
        <div class="card-title" style="color: var(--muted);">⚙️ Contract Configuration Reference</div>
        <button class="btn-copy" onclick="toggleJsonView()" id="json-btn-text">{ } View JSON</button>
      </div>

      <div id="slots-table-view">
        <table class="config-table">
          <thead><tr><th>Slot</th><th>Collection</th><th>Kind</th><th>Pattern</th></tr></thead>
          <tbody>
            ${registeredSlots.map(s => `
              <tr class="${(s.key === slot || s.collName === slot) ? 'active-slot' : ''}">
                <td style="color: ${s.key === slot ? 'var(--emerald)' : 'var(--text)'}; font-weight: 600;">${s.key}</td>
                <td><code>${s.collName}</code></td>
                <td><span style="color: var(--muted);">${s.kind}</span></td>
                <td><code>${s.pattern}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div id="json-contract-view" style="display: none;">
        <div class="code-block">${JSON.stringify(jsonContract, null, 2)}</div>
      </div>
    </div>
  </div>

  <script>
    const targetRoute = "${livePreviewTarget}";
    const fullUrl = "${fullDestinationUrl}";

    function copyFullUrl() {
      navigator.clipboard.writeText(fullUrl).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.innerText = '✅ Copied!';
        setTimeout(() => { btn.innerText = '📋 Copy URL'; }, 2000);
      });
    }

    async function autoProbe() {
      const statusEl = document.getElementById('probe-status');
      const latencyEl = document.getElementById('latency-indicator');
      const startTime = performance.now();
      try {
        const res = await fetch(targetRoute, { method: 'GET' });
        const elapsed = Math.round(performance.now() - startTime);
        statusEl.innerHTML = res.status === 200 ? '<span style="color: #34d399;">● HTTP 200 (' + elapsed + 'ms)</span>' : '<span style="color: #fbbf24;">● HTTP ' + res.status + '</span>';
        latencyEl.innerText = 'Rendered in ' + elapsed + 'ms';
      } catch (err) { statusEl.innerHTML = '<span style="color: #ef4444;">● Probe Failed</span>'; }
    }

    function toggleJsonView() {
      const tbl = document.getElementById('slots-table-view');
      const json = document.getElementById('json-contract-view');
      const btn = document.getElementById('json-btn-text');
      if (json.style.display === 'none') {
        json.style.display = 'block'; tbl.style.display = 'none'; btn.innerText = '☰ View Slots';
      } else {
        json.style.display = 'none'; tbl.style.display = 'block'; btn.innerText = '{ } View JSON';
      }
    }
    autoProbe();
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Set-Cookie': `${cookieName}=true; Path=/; Max-Age=14400; SameSite=Lax; HttpOnly`,
      },
    });
  };
}
