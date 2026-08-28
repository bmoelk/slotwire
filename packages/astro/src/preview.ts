import type { SlotWireConfig } from '@slotwire/core';
import { resolvePreviewRoute } from '@slotwire/core';

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

    // Render developer diagnostic workbench
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ SlotWire Preview Bridge & Diagnostics</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #111726;
      --card-inner: #161e31;
      --border: rgba(255, 255, 255, 0.1);
      --text: #f8fafc;
      --muted: #94a3b8;
      --emerald: #10b981;
      --emerald-bg: rgba(16, 185, 129, 0.12);
      --indigo: #6366f1;
      --amber: #f59e0b;
      --red: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 28px 20px;
      line-height: 1.5;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      background: linear-gradient(135deg, #10b981, #06b6d4);
      color: #042f2e;
      font-weight: 900;
      font-size: 18px;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 12px;
      color: var(--muted);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .data-table tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .data-table tr:last-child {
      border-bottom: none;
    }
    .data-table td {
      padding: 8px 0;
    }
    .data-table td.k {
      color: var(--muted);
      width: 130px;
      font-weight: 500;
    }
    .data-table td.v {
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      word-break: break-all;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-warning {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .actions-bar {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: var(--emerald);
      color: #042f2e;
    }
    .btn-primary:hover {
      background: #059669;
    }
    .btn-secondary {
      background: var(--card-inner);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .probe-result {
      margin-top: 14px;
      padding: 10px 14px;
      border-radius: 8px;
      background: var(--card-inner);
      border: 1px solid var(--border);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      display: none;
    }
    .explorer-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 8px;
    }
    .explorer-table th {
      text-align: left;
      padding: 8px;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
    }
    .explorer-table td {
      padding: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .explorer-table tr.active-slot {
      background: rgba(16, 185, 129, 0.08);
    }
    .iframe-wrapper {
      margin-top: 20px;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      background: #000;
      display: none;
    }
    .iframe-header {
      background: var(--card-inner);
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      border-bottom: 1px solid var(--border);
    }
    iframe {
      width: 100%;
      height: 520px;
      border: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="brand">
        <div class="brand-icon">⚡</div>
        <div>
          <h1 class="brand-title">SlotWire Live Preview Inspector</h1>
          <p class="brand-subtitle">Reverse Route Mapper & Telemetry Diagnostic Bridge</p>
        </div>
      </div>
      <div class="badge ${isTokenValid ? 'badge-success' : 'badge-warning'}">
        <span>●</span> ${isTokenValid ? 'Auth Verified' : 'Token Mismatch'}
      </div>
    </header>

    <div class="grid-2">
      <!-- Resolution Telemetry Card -->
      <div class="card">
        <div class="card-title">
          <span>Resolution Diagnostics</span>
          <span class="badge badge-success">Mapped</span>
        </div>
        <table class="data-table">
          <tr>
            <td class="k">Target Route</td>
            <td class="v" style="color: var(--emerald); font-weight: bold;">${resolvedPath}</td>
          </tr>
          <tr>
            <td class="k">Incoming Slot/Col</td>
            <td class="v"><code>${slot || '(empty)'}</code></td>
          </tr>
          <tr>
            <td class="k">Incoming Slug/ID</td>
            <td class="v"><code>${slug || '(empty)'}</code></td>
          </tr>
          <tr>
            <td class="k">Auth Cookie</td>
            <td class="v"><code>slotwire_preview=true</code></td>
          </tr>
          <tr>
            <td class="k">Raw Query</td>
            <td class="v" style="font-size: 11px; color: var(--muted);">${url.search || '(none)'}</td>
          </tr>
        </table>

        <div class="actions-bar">
          <a href="${resolvedPath}" class="btn btn-primary" id="open-btn">
            <span>🚀 Open Full Preview &rarr;</span>
          </a>
          <button class="btn btn-secondary" onclick="probeDestination('${resolvedPath}')">
            <span>⚡ Probe Route</span>
          </button>
          <button class="btn btn-secondary" onclick="toggleIframe('${resolvedPath}')">
            <span>👁️ Embedded Frame</span>
          </button>
        </div>

        <div id="probe-box" class="probe-result"></div>
      </div>

      <!-- Live Contract Slots Explorer -->
      <div class="card">
        <div class="card-title">
          <span>Active Contract Slots (${registeredSlots.length})</span>
        </div>
        <table class="explorer-table">
          <thead>
            <tr>
              <th>Slot Key</th>
              <th>Collection</th>
              <th>Preview Mapping</th>
            </tr>
          </thead>
          <tbody>
            ${registeredSlots.map(s => `
              <tr class="${(s.key === slot || s.collName === slot) ? 'active-slot' : ''}">
                <td style="color: ${s.key === slot ? 'var(--emerald)' : 'var(--text)'};">${s.key}</td>
                <td style="color: var(--muted);">${s.collName}</td>
                <td style="color: #38bdf8;">${s.pattern}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Embedded In-Situ iframe Viewer -->
    <div id="iframe-container" class="iframe-wrapper">
      <div class="iframe-header">
        <span>In-Situ Preview: <code id="iframe-url-display" style="color: var(--emerald);">${resolvedPath}</code></span>
        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="toggleIframe()">Close Frame</button>
      </div>
      <iframe id="preview-iframe" src="about:blank"></iframe>
    </div>
  </div>

  <script>
    const telemetry = {
      timestamp: new Date().toISOString(),
      slot: "${slot}",
      slug: "${slug}",
      resolvedRoute: "${resolvedPath}",
      authStatus: "${isTokenValid ? 'VALID' : 'INVALID'}"
    };
    console.log('[SlotWire Preview Telemetry]', telemetry);

    async function probeDestination(route) {
      const box = document.getElementById('probe-box');
      box.style.display = 'block';
      box.innerHTML = '<span style="color: #38bdf8;">[HTTP PROBE]</span> Fetching ' + route + '...';
      
      const startTime = performance.now();
      try {
        const res = await fetch(route, { method: 'GET' });
        const elapsed = Math.round(performance.now() - startTime);
        const statusColor = res.status === 200 ? '#34d399' : (res.status < 400 ? '#38bdf8' : '#ef4444');
        box.innerHTML = '<span style="color:' + statusColor + ';">[HTTP ' + res.status + ' ' + res.statusText + ']</span> ' +
          'Resolved in ' + elapsed + 'ms | Content-Type: ' + (res.headers.get('content-type') || 'unknown') +
          '<br><span style="color: var(--muted); font-size: 11px;">URL: ' + res.url + '</span>';
      } catch (err) {
        box.innerHTML = '<span style="color: #ef4444;">[PROBE ERROR]</span> ' + err.message;
      }
    }

    function toggleIframe(route) {
      const container = document.getElementById('iframe-container');
      const frame = document.getElementById('preview-iframe');
      if (container.style.display === 'block') {
        container.style.display = 'none';
        frame.src = 'about:blank';
      } else {
        container.style.display = 'block';
        if (route) frame.src = route;
      }
    }
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
