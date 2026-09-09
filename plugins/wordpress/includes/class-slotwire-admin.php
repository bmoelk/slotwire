<?php
/**
 * SlotWire Admin Settings Page
 *
 * Provides Settings > SlotWire Headless administrative configuration,
 * secret generation, test webhook dispatching, and Astro configuration code generation.
 *
 * @package SlotwireHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

class Slotwire_Admin {

    /**
     * Registers admin hooks.
     */
    public function init() {
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_ajax_slotwire_generate_secret', [$this, 'ajax_generate_secret']);
        add_action('wp_ajax_slotwire_test_webhook', [$this, 'ajax_test_webhook']);
    }

    /**
     * Adds SlotWire Headless settings page under Settings.
     */
    public function add_settings_page() {
        add_options_page(
            __('SlotWire Headless', 'slotwire-headless'),
            __('SlotWire Headless', 'slotwire-headless'),
            'manage_options',
            'slotwire-headless',
            [$this, 'render_admin_page']
        );
    }

    /**
     * Registers settings fields.
     */
    public function register_settings() {
        register_setting('slotwire_settings_group', 'slotwire_frontend_url', [
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting('slotwire_settings_group', 'slotwire_preview_secret', [
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        register_setting('slotwire_settings_group', 'slotwire_webhook_url', [
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting('slotwire_settings_group', 'slotwire_webhook_secret', [
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        register_setting('slotwire_settings_group', 'slotwire_cors_origins', [
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        register_setting('slotwire_settings_group', 'slotwire_redirect_frontend', [
            'sanitize_callback' => 'rest_sanitize_boolean',
        ]);
    }

    /**
     * Enqueues admin stylesheet and JavaScript.
     */
    public function enqueue_assets($hook) {
        if ($hook !== 'settings_page_slotwire-headless') {
            return;
        }

        wp_enqueue_style(
            'slotwire-admin-css',
            SLOTWIRE_PLUGIN_URL . 'assets/css/admin.css',
            [],
            SLOTWIRE_VERSION
        );

        wp_enqueue_script(
            'slotwire-admin-js',
            SLOTWIRE_PLUGIN_URL . 'assets/js/admin.js',
            ['jquery'],
            SLOTWIRE_VERSION,
            true
        );

        wp_localize_script('slotwire-admin-js', 'slotwireAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('slotwire_admin_nonce'),
        ]);
    }

    /**
     * AJAX handler: generates a new cryptographically secure 32-byte hex secret.
     */
    public function ajax_generate_secret() {
        check_ajax_referer('slotwire_admin_nonce', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        try {
            $secret = bin2hex(random_bytes(32));
        } catch (Exception $e) {
            $secret = wp_generate_password(64, false);
        }

        wp_send_json_success(['secret' => $secret]);
    }

    /**
     * AJAX handler: tests on-demand ISR revalidation webhook connection.
     */
    public function ajax_test_webhook() {
        check_ajax_referer('slotwire_admin_nonce', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        $webhook = new Slotwire_Webhook();
        $result = $webhook->dispatch_test_ping();

        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }

    /**
     * Renders the administrative settings page.
     */
    public function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $frontend_url     = get_option('slotwire_frontend_url', '');
        $preview_secret   = get_option('slotwire_preview_secret', '');
        $webhook_url      = get_option('slotwire_webhook_url', '');
        $webhook_secret   = get_option('slotwire_webhook_secret', '');
        $cors_origins     = get_option('slotwire_cors_origins', '*');
        $redirect_front   = get_option('slotwire_redirect_frontend', false);

        $site_url = get_site_url();
        $rest_url = rest_url('slotwire/v1/content/posts');
        ?>
        <div class="wrap slotwire-admin-wrap">
            <header class="slotwire-header">
                <div class="slotwire-logo">
                    <span class="slotwire-bolt">⚡</span>
                    <h1><?php esc_html_e('SlotWire Headless Companion', 'slotwire-headless'); ?></h1>
                    <span class="slotwire-badge">v<?php echo esc_html(SLOTWIRE_VERSION); ?></span>
                </div>
                <p class="slotwire-subtitle">
                    <?php esc_html_e('Connect WordPress to your Astro static or SSR frontend with 1-click preview, signed tokens, and on-demand ISR revalidation.', 'slotwire-headless'); ?>
                </p>

                <!-- Status Cards -->
                <div class="slotwire-status-pills">
                    <div class="slotwire-status-pill pill-success">
                        <span class="dot"></span>
                        <strong>REST API:</strong> <?php esc_html_e('Active (/wp-json/slotwire/v1)', 'slotwire-headless'); ?>
                    </div>
                    <div class="slotwire-status-pill <?php echo !empty($preview_secret) ? 'pill-success' : 'pill-warning'; ?>">
                        <span class="dot"></span>
                        <strong>Preview Token Secret:</strong> <?php echo !empty($preview_secret) ? esc_html__('Configured', 'slotwire-headless') : esc_html__('Missing', 'slotwire-headless'); ?>
                    </div>
                    <div class="slotwire-status-pill <?php echo !empty($frontend_url) ? 'pill-success' : 'pill-info'; ?>">
                        <span class="dot"></span>
                        <strong>Frontend:</strong> <?php echo !empty($frontend_url) ? esc_html($frontend_url) : esc_html__('Not Set', 'slotwire-headless'); ?>
                    </div>
                </div>
            </header>

            <div class="slotwire-grid">
                <!-- Settings Column -->
                <div class="slotwire-col">
                    <div class="slotwire-card">
                        <h2><?php esc_html_e('Configuration', 'slotwire-headless'); ?></h2>

                        <form method="post" action="options.php">
                            <?php
                            settings_fields('slotwire_settings_group');
                            do_settings_sections('slotwire_settings_group');
                            ?>

                            <table class="form-table slotwire-table">
                                <tr>
                                    <th scope="row">
                                        <label for="slotwire_frontend_url"><?php esc_html_e('Astro Frontend URL', 'slotwire-headless'); ?></label>
                                    </th>
                                    <td>
                                        <input
                                            type="url"
                                            id="slotwire_frontend_url"
                                            name="slotwire_frontend_url"
                                            value="<?php echo esc_attr($frontend_url); ?>"
                                            placeholder="https://staging.mysite.com or http://localhost:4321"
                                            class="regular-text code"
                                        />
                                        <p class="description">
                                            <?php esc_html_e('The root URL of your Astro website. Used to rewrite post preview links and compute webhook revalidation URLs.', 'slotwire-headless'); ?>
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <th scope="row">
                                        <label for="slotwire_preview_secret"><?php esc_html_e('Preview HMAC Secret', 'slotwire-headless'); ?></label>
                                    </th>
                                    <td>
                                        <div class="slotwire-input-btn-group">
                                            <input
                                                type="text"
                                                id="slotwire_preview_secret"
                                                name="slotwire_preview_secret"
                                                value="<?php echo esc_attr($preview_secret); ?>"
                                                class="regular-text code"
                                            />
                                            <button type="button" id="sw-btn-generate-secret" class="button">
                                                🎲 <?php esc_html_e('Generate', 'slotwire-headless'); ?>
                                            </button>
                                            <button type="button" id="sw-btn-copy-secret" class="button">
                                                📋 <?php esc_html_e('Copy', 'slotwire-headless'); ?>
                                            </button>
                                        </div>
                                        <p class="description">
                                            <?php esc_html_e('Shared cryptographic key used to sign and verify HMAC-SHA256 live preview tokens. Must match preview.secret in your Astro slotwire.config.ts.', 'slotwire-headless'); ?>
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <th scope="row">
                                        <label for="slotwire_webhook_url"><?php esc_html_e('Revalidation Webhook URL', 'slotwire-headless'); ?></label>
                                    </th>
                                    <td>
                                        <input
                                            type="url"
                                            id="slotwire_webhook_url"
                                            name="slotwire_webhook_url"
                                            value="<?php echo esc_attr($webhook_url); ?>"
                                            placeholder="<?php echo !empty($frontend_url) ? esc_attr(rtrim($frontend_url, '/') . '/api/slotwire/revalidate') : 'https://mysite.com/api/slotwire/revalidate'; ?>"
                                            class="regular-text code"
                                        />
                                        <p class="description">
                                            <?php esc_html_e('Target endpoint triggered when posts are published, updated, or trashed. Defaults to {frontend_url}/api/slotwire/revalidate.', 'slotwire-headless'); ?>
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <th scope="row">
                                        <label for="slotwire_webhook_secret"><?php esc_html_e('Webhook Secret (Optional)', 'slotwire-headless'); ?></label>
                                    </th>
                                    <td>
                                        <input
                                            type="text"
                                            id="slotwire_webhook_secret"
                                            name="slotwire_webhook_secret"
                                            value="<?php echo esc_attr($webhook_secret); ?>"
                                            placeholder="<?php esc_attr_e('Defaults to Preview HMAC Secret if blank', 'slotwire-headless'); ?>"
                                            class="regular-text code"
                                        />
                                        <p class="description">
                                            <?php esc_html_e('If blank, uses the Preview HMAC Secret above.', 'slotwire-headless'); ?>
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <th scope="row">
                                        <label for="slotwire_cors_origins"><?php esc_html_e('CORS Allowed Origins', 'slotwire-headless'); ?></label>
                                    </th>
                                    <td>
                                        <input
                                            type="text"
                                            id="slotwire_cors_origins"
                                            name="slotwire_cors_origins"
                                            value="<?php echo esc_attr($cors_origins); ?>"
                                            class="regular-text code"
                                        />
                                        <p class="description">
                                            <?php esc_html_e('Value for Access-Control-Allow-Origin header (e.g. * or https://mysite.com).', 'slotwire-headless'); ?>
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <th scope="row"><?php esc_html_e('Headless Visitor Routing', 'slotwire-headless'); ?></th>
                                    <td>
                                        <label for="slotwire_redirect_frontend">
                                            <input
                                                type="checkbox"
                                                id="slotwire_redirect_frontend"
                                                name="slotwire_redirect_frontend"
                                                value="1"
                                                <?php checked(1, $redirect_front); ?>
                                            />
                                            <?php esc_html_e('Redirect all public frontend visitors to the Astro site', 'slotwire-headless'); ?>
                                        </label>
                                        <p class="description">
                                            <?php esc_html_e('When enabled, non-admin visitors to WordPress front pages are redirected to the equivalent URL on your Astro site.', 'slotwire-headless'); ?>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <div class="slotwire-submit-row">
                                <?php submit_button(__('Save Settings', 'slotwire-headless'), 'primary', 'submit', false); ?>

                                <button type="button" id="sw-btn-test-webhook" class="button button-secondary" style="margin-left: 10px;">
                                    📡 <?php esc_html_e('Test Webhook Ping', 'slotwire-headless'); ?>
                                </button>
                                <span id="sw-webhook-test-result" class="slotwire-test-result"></span>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Astro Integration Guide Column -->
                <div class="slotwire-col">
                    <div class="slotwire-card">
                        <h2><?php esc_html_e('Astro Contract Integration', 'slotwire-headless'); ?></h2>
                        <p>
                            <?php esc_html_e('Drop this configuration into your Astro project (slotwire.config.ts):', 'slotwire-headless'); ?>
                        </p>

                        <div class="slotwire-code-box">
                            <pre id="sw-astro-config-code"><code>import { defineContract, s } from '@slotwire/core';

export default defineContract({
  cms: {
    provider: 'wordpress',
    apiUrl: '<?php echo esc_url($site_url); ?>',
  },
  preview: {
    secret: '<?php echo esc_js($preview_secret ?: 'YOUR_PREVIEW_SECRET'); ?>',
  },
  sync: {
    webhookSecret: '<?php echo esc_js($webhook_secret ?: $preview_secret ?: 'YOUR_PREVIEW_SECRET'); ?>',
  },
  ui: {
    editor: 'html', // Recommended for WordPress HTML fragments with Pell
  },
  slots: {
    hero: s.section({
      key: 'hero',
      collection: 'posts',
      defaultTitle: 'Hero Banner',
    }),
  },
});</code></pre>
                            <button type="button" id="sw-btn-copy-config" class="button button-secondary slotwire-code-copy-btn">
                                📋 <?php esc_html_e('Copy Code', 'slotwire-headless'); ?>
                            </button>
                        </div>

                        <div class="slotwire-doc-box">
                            <h3>💡 <?php esc_html_e('Slot Transformers ("Let WordPress be WordPress")', 'slotwire-headless'); ?></h3>
                            <p>
                                <?php esc_html_e('WordPress often includes formatting quirks like wpautop extra <br> tags or custom plugin fields. Use Slot Transformers in defineContract() to clean output without modifying WordPress core:', 'slotwire-headless'); ?>
                            </p>
                            <pre><code>hero: s.section({
  key: 'hero',
  transform: (item) => ({
    ...item,
    content: item.content?.replace(/&lt;br\s*\/?&gt;/gi, ''),
  }),
})</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}
