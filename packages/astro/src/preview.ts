import type { SlotWireConfig } from '@slotwire/core';
import { resolvePreviewRoute, exportContractToJson, generateBlueprint } from '@slotwire/core';

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

    // 1. Direct Live Draft Rendering Mode (with authentic template)
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
          
          // Markdown formatting with Admonition styling
          let bodyHtml = rawContent
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold font-serif text-zinc-900 dark:text-zinc-100 mt-8 mb-4">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-100 mt-10 mb-4">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-100 mt-12 mb-6">$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/```ts([\s\S]*?)```/gim, '<pre class="bg-zinc-900 text-zinc-100 p-4 rounded-lg my-4 overflow-x-auto text-xs font-mono border border-zinc-800"><code>$1</code></pre>')
            .replace(/```([\s\S]*?)```/gim, '<pre class="bg-zinc-900 text-zinc-100 p-4 rounded-lg my-4 overflow-x-auto text-xs font-mono border border-zinc-800"><code>$1</code></pre>')
            .replace(/<Admonition\s+variant="([^"]+)">([\s\S]*?)<\/Admonition>/gim, (_m: string, v: string, inner: string) => {
              const variant = v.toLowerCase();
              const border = variant === 'tip' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' :
                             variant === 'caution' || variant === 'warning' ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300' :
                             variant === 'danger' ? 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300' :
                             'border-sky-500 bg-sky-500/10 text-sky-800 dark:text-sky-300';
              return `<div class="my-6 rounded-r-lg border-l-4 p-4 ${border}"><div class="font-bold text-xs uppercase mb-1">${variant}</div>${inner.trim()}</div>`;
            })
            .replace(/\n\n/gim, '</p><p class="my-4 leading-relaxed text-zinc-700 dark:text-zinc-300">');

          const categoriesList = typeof postData.data.categories === 'string'
            ? postData.data.categories.split(',').map((c: string) => c.trim()).filter(Boolean)
            : (Array.isArray(postData.data.categories) ? postData.data.categories : ['Architecture', 'Systems Engineering', 'Edge Computing']);

          const liveHtml = `<!DOCTYPE html>
<html lang="en">
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
            brand: { 50: '#eef2ff', 500: '#6366f1', 600: '#4f46e5' }
          }
        }
      }
    };
    function initTheme() {
      const colorTheme = localStorage.getItem("colorTheme");
      if (!colorTheme || colorTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else if (colorTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    }
    initTheme();
    function toggleTheme() {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("colorTheme", isDark ? "dark" : "light");
    }
  </script>
  <style>
    @font-face {
      font-family: "Harabara";
      font-style: normal;
      font-weight: 400 700;
      font-display: swap;
      src: url("/fonts/Harabara.ttf") format("truetype");
    }
    .font-harabara { font-family: "Harabara", sans-serif; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-stone-50 dark:bg-[#070a12] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between transition-colors duration-200">
  <!-- Top Navigation Bar -->
  <header class="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#0b1120]/80 border-b border-zinc-200 dark:border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <!-- BrainEndeavor Brand Logo -->
        <a href="/" class="flex items-center gap-3 group">
          <img src="/assets/logo_without_text.png" alt="BrainEndeavor Logo" class="h-10 w-auto object-contain shrink-0 drop-shadow transition-transform group-hover:scale-105" />
          <span class="font-harabara text-2xl sm:text-3xl font-normal leading-none tracking-wide lowercase">
            <span class="text-[#9f2020]">brain</span><span class="text-[#f5a41f]">endeavor</span>
          </span>
        </a>
        <nav class="hidden md:flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-300 font-medium">
          <a href="/#services" class="hover:text-zinc-900 dark:hover:text-white transition-colors">Services</a>
          <a href="/#technology" class="hover:text-zinc-900 dark:hover:text-white transition-colors">Technology</a>
          <a href="/blog" class="text-[#9f2020] dark:text-emerald-400 font-semibold">Blog</a>
          <a href="/about" class="hover:text-zinc-900 dark:hover:text-white transition-colors">About</a>
          <a href="/contact" class="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
        </nav>
      </div>

      <div class="flex items-center gap-3">
        <button onclick="toggleTheme()" class="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Toggle Light/Dark Theme">
          <svg class="size-4 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          <svg class="size-4 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
        </button>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <span class="size-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Draft Preview
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
          <span class="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-zinc-100 dark:bg-emerald-950/60 text-zinc-700 dark:text-emerald-400 border border-zinc-200 dark:border-emerald-500/20">
            ${cat}
          </span>
        `).join('')}
      </div>

      <!-- Title -->
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-center text-zinc-900 dark:text-white leading-tight mb-6">
        ${postData.data.title || postData.title}
      </h1>

      <!-- Author Row -->
      <div class="flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-10 pb-6 border-b border-zinc-200 dark:border-white/10">
        <div class="flex items-center gap-2">
          <div class="size-7 rounded-full bg-zinc-200 dark:bg-emerald-500/20 border border-zinc-300 dark:border-emerald-500/40 flex items-center justify-center font-bold text-zinc-700 dark:text-emerald-300">
            BM
          </div>
          <span class="text-zinc-800 dark:text-zinc-200 font-medium">Brian Moelk</span>
        </div>
        <span>&bull;</span>
        <time datetime="${new Date().toISOString()}">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
        <span>&bull;</span>
        <span class="text-emerald-600 dark:text-emerald-400 font-medium">5 min read</span>
      </div>

      <!-- Hero Image -->
      <div class="rounded-2xl overflow-hidden mb-12 border border-zinc-200 dark:border-white/10 shadow-lg dark:shadow-2xl bg-zinc-100 dark:bg-zinc-900">
        <img 
          src="${postData.data.heroImage || 'https://cms.brainendeavor.com/media/data-migration-hero.jpg'}" 
          alt="${postData.data.title || postData.title}" 
          class="w-full max-h-[460px] object-cover"
          onerror="this.style.display='none'"
        />
      </div>

      <!-- Article Body -->
      <div class="prose prose-zinc dark:prose-invert prose-lg max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed prose-headings:font-serif prose-headings:text-zinc-900 dark:prose-headings:text-white prose-a:text-[#9f2020] dark:prose-a:text-emerald-400 prose-code:text-emerald-700 dark:prose-code:text-emerald-300">
        <p class="leading-relaxed text-zinc-700 dark:text-zinc-300 text-lg">${bodyHtml}</p>
      </div>

      <!-- Author Bio Footer -->
      <div class="mt-16 p-6 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 flex items-start gap-4 shadow-sm">
        <div class="size-12 rounded-full bg-zinc-100 dark:bg-emerald-500/20 border border-zinc-200 dark:border-emerald-500/40 flex items-center justify-center font-bold text-lg text-zinc-800 dark:text-emerald-300 shrink-0">
          BM
        </div>
        <div>
          <h4 class="font-bold text-zinc-900 dark:text-white text-sm">Brian Moelk</h4>
          <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Founder & Principal Systems Architect at BrainEndeavor. Specializing in high-performance distributed systems, edge runtimes, and headless CMS integrations.</p>
        </div>
      </div>
    </article>
  </main>

  <!-- Site Footer -->
  <footer class="mt-20 border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-[#040711] py-8 text-center text-xs text-zinc-500">
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

    // Render developer diagnostic workbench
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SlotWire Preview Bridge & Diagnostics</title>
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
      width: 36px;
      height: 36px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      shrink-0: 0;
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
    .full-url-box {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 10px;
    }
    .full-url-text { font-family: ui-monospace, monospace; font-size: 12px; color: #38bdf8; word-break: break-all; }
    .btn-copy {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--muted);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .btn-copy:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text);
      border-color: rgba(255, 255, 255, 0.3);
    }
    .actions-row { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
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
        <div class="brand-icon">
          <!-- Bespoke SlotWire Connector SVG Logo -->
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#10b981" stroke-width="1.8"/>
            <rect x="16" y="4" width="6" height="16" rx="2.5" fill="#0f172a" stroke="#06b6d4" stroke-width="1.8"/>
            <circle cx="5" cy="8.5" r="1.2" fill="#10b981"/>
            <circle cx="5" cy="15.5" r="1.2" fill="#10b981"/>
            <circle cx="19" cy="8.5" r="1.2" fill="#06b6d4"/>
            <circle cx="19" cy="15.5" r="1.2" fill="#06b6d4"/>
            <path d="M6.5 8.5H17.5" stroke="url(#swg1)" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M6.5 15.5H17.5" stroke="url(#swg2)" stroke-width="1.8" stroke-linecap="round"/>
            <defs>
              <linearGradient id="swg1" x1="6.5" y1="8.5" x2="17.5" y2="8.5" gradientUnits="userSpaceOnUse">
                <stop stop-color="#10b981"/><stop offset="1" stop-color="#06b6d4"/>
              </linearGradient>
              <linearGradient id="swg2" x1="6.5" y1="15.5" x2="17.5" y2="15.5" gradientUnits="userSpaceOnUse">
                <stop stop-color="#10b981"/><stop offset="1" stop-color="#06b6d4"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
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
          <div class="metric-value" style="color: var(--emerald);">${resolvedPath}</div>
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
        <button class="btn-copy" onclick="copyFullUrl()" id="copy-btn" title="Copy URL to clipboard">
          <svg id="copy-icon-svg" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </button>
      </div>

      <div class="actions-row">
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
        <button class="btn-copy" style="width: auto; padding: 4px 8px; font-size: 11px;" onclick="toggleJsonView()" id="json-btn-text">{ } View JSON</button>
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
        btn.innerHTML = '<svg width="14" height="14" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
        setTimeout(() => {
          btn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
        }, 2000);
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
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  };
}

/**
 * Handles in-situ Pre-Create batch scaffolding requests dispatched from the frontend preview modal.
 */
export function createScaffoldHandler(config: SlotWireConfig) {
  return async ({ request, cookies }: { request: Request; cookies: any }) => {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const isPreview =
      cookies.get('slotwire_preview')?.value === 'true' ||
      (globalThis as any).process?.env?.NODE_ENV === 'development';

    if (!isPreview) {
      return new Response('Unauthorized: Active preview session required to scaffold blueprints', { status: 401 });
    }

    try {
      const body: any = await request.json();
      const archetypeKey = body.archetypeKey || 'page';
      const targetSlug = body.targetSlug;
      const targetTitle = body.targetTitle;

      if (!targetSlug) {
        return new Response(JSON.stringify({ success: false, error: 'targetSlug is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 1. Generate Deterministic Blueprint
      const blueprint = generateBlueprint(config, archetypeKey, {
        targetSlug,
        targetTitle,
      });

      // 2. Dispatch to CMS Scaffolder endpoint
      const cmsApi = config.cms.apiUrl.replace(/\/+$/, '');
      const scaffoldEndpoint = `${cmsApi}/api/slotwire/scaffold-blueprint`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.cms.apiKey) {
        headers['Authorization'] = `Bearer ${config.cms.apiKey}`;
      }

      const res = await fetch(scaffoldEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ blueprint }),
      }).catch(async () => {
        // Fallback: Individual collection batch POSTs
        const createdIds: string[] = [];
        for (const item of blueprint.items.filter((i) => i.action === 'create')) {
          const itemRes = await fetch(`${cmsApi}/api/collections/${encodeURIComponent(item.collection)}/content`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ data: item.data, status: 'draft' }),
          }).catch(() => null);
          if (itemRes && itemRes.ok) {
            const itemJson: any = await itemRes.json().catch(() => ({}));
            createdIds.push(itemJson.id || item.id);
          }
        }
        return new Response(
          JSON.stringify({
            success: true,
            targetSlug,
            createdCount: createdIds.length,
            createdIds,
            targetUrl: `/${targetSlug}?slotwire_preview=true`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const resText = await res.text();
      return new Response(resText, {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

/**
 * Handles on-demand SSR slot fragment evaluation for zero-reload View Transition morphing.
 */
export function createSlotRenderHandler(config: SlotWireConfig, slotRenderer?: (slot: string, pageSlug: string) => Promise<string>) {
  return async ({ request, cookies }: { request: Request; cookies: any }) => {
    const url = new URL(request.url);
    const slot = url.searchParams.get('slot') || '';
    const pageSlug = url.searchParams.get('pageSlug') || '';

    const isPreview =
      cookies.get('slotwire_preview')?.value === 'true' ||
      (globalThis as any).process?.env?.NODE_ENV === 'development';

    if (!isPreview) {
      return new Response('Unauthorized: Preview session required', { status: 401 });
    }

    if (!slot) {
      return new Response('Missing slot parameter', { status: 400 });
    }

    if (slotRenderer) {
      try {
        const html = await slotRenderer(slot, pageSlug);
        return new Response(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      } catch (err: any) {
        return new Response(`Error rendering slot '${slot}': ${err.message}`, { status: 500 });
      }
    }

    // Default fallback placeholder
    return new Response(
      `<div data-slotwire-slot="${slot}" data-slotwire-page="${pageSlug}" class="slotwire-slot-updated"></div>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  };
}

