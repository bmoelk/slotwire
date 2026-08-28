# SlotWire Live Preview Bridge & Diagnostics

## 1. Overview
The SlotWire Preview Bridge (`/api/preview`) receives dispatch requests from the CMS editor, authenticates the preview session, resolves the target route, and provides an interactive developer inspection workbench.

---

## 2. Dispatch Protocol

When an editor clicks **Preview** in the CMS:
1. **Request**: The browser opens:
   ```
   https://<frontend-url>/api/preview?secret=<token>&collection=<col_name>&slug=<slug>
   ```
2. **Authentication**: `/api/preview` verifies `secret === config.cms.previewSecret`.
3. **Session Cookie**: Sets an HTTP-only `slotwire_preview=true` cookie (TTL: 4 hours).
4. **Route Mapping**: Runs 2-Pass reverse route resolution to compute `targetRoute`.
5. **Interactive Workbench**: Serves the developer telemetry screen.

---

## 3. Developer Telemetry Features

* **Resolution Outcome**: Live card showing resolved route, incoming collection, document slug, and raw query string.
* **Auto-Probe**: In-browser `fetch()` testing HTTP status (`200 OK`, `404`) and latency.
* **In-Situ iframe Preview**: Embedded frame displaying the live rendered page immediately.
* **JSON Contract Reference**: Direct toggle to inspect the underlying JSON contract matrix.
