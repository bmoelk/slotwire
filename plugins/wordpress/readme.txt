=== SlotWire Headless Companion ===
Contributors: bmoelk, slotwire
Tags: headless, astro, rest api, preview, webhooks
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 0.2.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Headless CMS companion plugin for SlotWire & Astro. 1-click live preview with signed HMAC tokens, clean REST APIs, Gutenberg block AST, and on-demand ISR revalidation webhooks.

== Description ==

SlotWire Headless Companion transforms WordPress into a first-class headless CMS backend for modern Astro web applications:

* **1-Click Live Preview**: Rewrites WordPress preview links with cryptographically signed HMAC-SHA256 JWT tokens. Allows authorized content authors to preview live draft posts and pages in real time on Astro staging environments.
* **Clean REST API**: Exposes `/wp-json/slotwire/v1/content/:post_type` with clean, flattened data structures (no `.rendered` nesting), Gutenberg block AST parsing (`blocks`), and Advanced Custom Fields (`acf`) support.
* **On-Demand ISR Revalidation**: Automatically dispatches non-blocking, HMAC-signed webhooks to `/api/slotwire/revalidate` whenever content is published, updated, or deleted, purging caches instantaneously.
* **Permissive CORS & Headless Routing**: Automatic CORS headers for Astro content loaders and optional redirection of public WordPress visitors to your Astro frontend.
* **Zero Runtime Dependencies**: Written in pure native PHP 7.4+ and 8.x. No Composer or external runtime packages required.

== Installation ==

1. Upload the `slotwire-headless.zip` file to your WordPress Plugins screen (`Plugins > Add New > Upload Plugin`), or upload the `slotwire-headless` folder directly into `/wp-content/plugins/`.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Navigate to **Settings > SlotWire Headless** in your WordPress admin bar.
4. Enter your Astro Frontend URL (e.g. `https://staging.mysite.com` or `http://localhost:4321`).
5. Click **Generate** to create a cryptographically secure preview secret.
6. Copy the generated Astro configuration code snippet into your Astro project's `slotwire.config.ts`.
7. Click **Save Settings**.

== Changelog ==

= 0.2.0 =
* Initial release of SlotWire Headless Companion for WordPress.
* HMAC-SHA256 preview token signing compatible with `@slotwire/core`.
* Clean `/wp-json/slotwire/v1/*` REST endpoints with Gutenberg block AST.
* On-demand ISR revalidation webhooks with non-blocking dispatch.
* Gutenberg and Classic Editor sidebar slot assignment.
