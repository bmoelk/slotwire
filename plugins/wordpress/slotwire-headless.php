<?php
/**
 * Plugin Name:       SlotWire Headless Companion
 * Plugin URI:        https://github.com/bmoelk/slotwire
 * Description:       Headless CMS companion plugin for SlotWire and Astro. Provides 1-click live preview with signed HMAC-SHA256 tokens, clean REST APIs, Gutenberg block AST, and on-demand ISR revalidation webhooks.
 * Version:           0.2.0
 * Author:            SlotWire Core Team
 * Author URI:        https://github.com/bmoelk/slotwire
 * License:           MIT
 * License URI:       https://opensource.org/licenses/MIT
 * Text Domain:       slotwire-headless
 * Domain Path:       /languages
 * Requires at least: 5.8
 * Requires PHP:      7.4
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

// Define Plugin Constants
define('SLOTWIRE_VERSION', '0.2.0');
define('SLOTWIRE_PLUGIN_FILE', __FILE__);
define('SLOTWIRE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SLOTWIRE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SLOTWIRE_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Require Core Plugin Coordinator
require_once SLOTWIRE_PLUGIN_DIR . 'includes/class-slotwire-plugin.php';

/**
 * Plugin Activation Handler: sets initial configuration defaults.
 */
function slotwire_activate() {
    if (!get_option('slotwire_preview_secret')) {
        try {
            $secret = bin2hex(random_bytes(32));
        } catch (Exception $e) {
            $secret = wp_generate_password(64, false);
        }
        update_option('slotwire_preview_secret', $secret);
    }

    if (!get_option('slotwire_cors_origins')) {
        update_option('slotwire_cors_origins', '*');
    }
}
register_activation_hook(__FILE__, 'slotwire_activate');

/**
 * Plugin Deactivation Handler.
 */
function slotwire_deactivate() {
    // Flush rewrite rules on deactivation if needed
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'slotwire_deactivate');

/**
 * Bootstraps the SlotWire companion plugin.
 */
function slotwire_init() {
    return Slotwire_Plugin::instance();
}

// Launch plugin lifecycle
add_action('plugins_loaded', 'slotwire_init');
