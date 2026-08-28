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
      --border-focus: rgba(16, 185, 129, 0.4);
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
      padding: 24px 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 14px;
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
      width: 36px;
      height: 36px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 12px;
      color: var(--muted);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 9999px;
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
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .card-primary {
      border-color: rgba(16, 185, 129, 0.3);
      box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.15);
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-title-muted {
      color: var(--muted);
      font-size: 12px;
    }
    .telemetry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .metric-box {
      background: var(--card-alt);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
    }
    .metric-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .metric-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      word-break: break-all;
    }
    .actions-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 7px;
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
      background: var(--card-alt);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .probe-badge {
      font-family: ui-monospace, monospace;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--card-alt);
      border: 1px solid var(--border);
    }
    /* In-situ Live Frame */
    .preview-frame-card {
      background: #000;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
    }
    .frame-toolbar {
      background: var(--card-alt);
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      border-bottom: 1px solid var(--border);
    }
    iframe {
      width: 100%;
      height: 560px;
      border: none;
      background: #000;
    }
    /* Contract Config Section (Distinct Subordinate Visual Style) */
    .config-card {
      background: #0b111f;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 20px;
    }
    .config-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 12px;
    }
    .config-table th {
      text-align: left;
      padding: 8px 12px;
      color: var(--muted);
      font-weight: 600;
      border-bottom: 1px solid var(--border);
      background: rgba(0, 0, 0, 0.2);
    }
    .config-table td {
      padding: 8px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .config-table tr.active-slot {
      background: rgba(16, 185, 129, 0.1);
    }
    .code-block {
      background: #040711;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      color: #94a3b8;
      max-height: 220px;
      overflow-y: auto;
      margin-top: 12px;
      white-space: pre;
    }
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
      <div class="badge ${isTokenValid ? 'badge-success' : 'badge-warning'}">
        <span>●</span> ${isTokenValid ? 'Auth Verified' : 'Token Mismatch'}
      </div>
    </header>

    <!-- 1. Resolution Diagnostics Card (Primary Outcome) -->
    <div class="card card-primary">
      <div class="card-header">
        <div class="card-title">
          <span>● Resolution Outcome</span>
        </div>
        <span id="probe-status" class="probe-badge">Probing route...</span>
      </div>

      <div class="telemetry-grid">
        <div class="metric-box">
          <div class="metric-label">Target Route</div>
          <div class="metric-value" style="color: var(--emerald);">${resolvedPath}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Incoming Slot / Collection</div>
          <div class="metric-value">${slot || '(empty)'}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Document Slug / ID</div>
          <div class="metric-value">${slug || '(empty)'}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Preview Cookie</div>
          <div class="metric-value" style="color: #38bdf8;">slotwire_preview=true</div>
        </div>
      </div>

      <div class="actions-row">
        <div style="font-size: 12px; color: var(--muted);">
          Raw Query: <code>${url.search || '(none)'}</code>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="${resolvedPath}" class="btn btn-primary" target="_top">
            <span>🚀 Open Full Window &rarr;</span>
          </a>
          <button class="btn btn-secondary" onclick="reloadFrame()">
            <span>↻ Refresh Frame</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. Automatic In-Situ Live Preview Frame -->
    <div class="preview-frame-card">
      <div class="frame-toolbar">
        <div>
          <span>Live In-Situ Preview: </span>
          <code style="color: var(--emerald); font-weight: bold;">${resolvedPath}</code>
        </div>
        <div id="latency-indicator" style="color: var(--muted); font-size: 11px;">Loading...</div>
      </div>
      <iframe id="preview-iframe" src="${resolvedPath}"></iframe>
    </div>

    <!-- 3. Contract Configuration Reference (Underneath & Visually Subordinate) -->
    <div class="config-card">
      <div class="card-header">
        <div>
          <div class="card-title card-title-muted">⚙️ Contract Configuration Reference</div>
          <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">
            The active schema matrix used to determine route destinations. Configured in <code>slotwire.config.ts</code> or via JSON.
          </div>
        </div>
        <button class="btn btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="toggleJsonView()">
          <span id="json-btn-text">{ } View JSON Contract</span>
        </button>
      </div>

      <div id="slots-table-view">
        <table class="config-table">
          <thead>
            <tr>
              <th>Contract Slot</th>
              <th>CMS Collection</th>
              <th>Kind</th>
              <th>Route Pattern</th>
            </tr>
          </thead>
          <tbody>
            ${registeredSlots.map(s => `
              <tr class="${(s.key === slot || s.collName === slot) ? 'active-slot' : ''}">
                <td style="color: ${s.key === slot ? 'var(--emerald)' : 'var(--text)'}; font-weight: 600;">
                  ${s.key} ${s.key === slot ? '◄' : ''}
                </td>
                <td style="color: var(--muted);">${s.collName}</td>
                <td style="color: var(--muted);">${s.kind}</td>
                <td style="color: #38bdf8;">${s.pattern}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div id="json-contract-view" style="display: none;">
        <div class="code-block">${jsonContract}</div>
        <div style="font-size: 11px; color: var(--muted); margin-top: 8px;">
          💡 <b>Remote Storage</b>: This contract schema is pure JSON-serializable and can be dynamically loaded from Cloudflare R2 or KV via <code>env.SLOTWIRE_CONTRACT_JSON</code>.
        </div>
      </div>
    </div>
  </div>

  <script>
    const targetRoute = "${resolvedPath}";

    // Auto-probe route on page load
    async function autoProbe() {
      const statusEl = document.getElementById('probe-status');
      const latencyEl = document.getElementById('latency-indicator');
      const startTime = performance.now();

      try {
        const res = await fetch(targetRoute, { method: 'GET' });
        const elapsed = Math.round(performance.now() - startTime);
        if (res.status === 200) {
          statusEl.innerHTML = '<span style="color: #34d399;">● HTTP 200 OK (' + elapsed + 'ms)</span>';
        } else {
          statusEl.innerHTML = '<span style="color: #fbbf24;">● HTTP ' + res.status + ' (' + elapsed + 'ms)</span>';
        }
        latencyEl.innerText = 'Rendered in ' + elapsed + 'ms';
      } catch (err) {
        statusEl.innerHTML = '<span style="color: #ef4444;">● Probe Failed: ' + err.message + '</span>';
        latencyEl.innerText = 'Failed to load';
      }
    }

    function reloadFrame() {
      const frame = document.getElementById('preview-iframe');
      frame.src = targetRoute;
      autoProbe();
    }

    function toggleJsonView() {
      const tbl = document.getElementById('slots-table-view');
      const json = document.getElementById('json-contract-view');
      const btn = document.getElementById('json-btn-text');
      if (json.style.display === 'none') {
        json.style.display = 'block';
        tbl.style.display = 'none';
        btn.innerText = '☰ View Slots Table';
      } else {
        json.style.display = 'none';
        tbl.style.display = 'block';
        btn.innerText = '{ } View JSON Contract';
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
