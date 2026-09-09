<?php
/**
 * SlotWire Plugin Coordinator
 *
 * Singleton coordinator orchestrating all headless modules:
 * CORS, Preview Links, REST endpoints, Revalidation Webhooks, Slot Meta, and Admin UI.
 *
 * @package SlotwireHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

class Slotwire_Plugin {

    /**
     * Singleton instance.
     *
     * @var Slotwire_Plugin|null
     */
    private static $instance = null;

    /**
     * Component instances.
     */
    public $cors;
    public $preview;
    public $rest;
    public $webhook;
    public $meta;
    public $admin;

    /**
     * Retrieves the single instance of this class.
     *
     * @return Slotwire_Plugin
     */
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Private constructor to enforce singleton pattern.
     */
    private function __construct() {
        $this->load_dependencies();
        $this->init_components();
    }

    /**
     * Loads required class files.
     */
    private function load_dependencies() {
        require_once SLOTWIRE_PLUGIN_DIR . 'includes/class-slotwire-cors.php';
        require_once SLOTWIRE_PLUGIN_DIR . 'includes/class-slotwire-preview.php';
        require_once SLOTWIRE_PLUGIN_DIR . 'includes/class-slotwire-rest.php';
        require_once SLOTWIRE_PLUGIN_DIR . 'includes/class-slotwire-webhook.php';
        require_once SLOTWIRE_PLUGIN_DIR . 'includes/class-slotwire-meta.php';
        require_once SLOTWIRE_PLUGIN_DIR . 'includes/class-slotwire-admin.php';
    }

    /**
     * Instantiates components and registers WordPress lifecycle hooks.
     */
    private function init_components() {
        $this->cors    = new Slotwire_Cors();
        $this->preview = new Slotwire_Preview();
        $this->rest    = new Slotwire_Rest();
        $this->webhook = new Slotwire_Webhook();
        $this->meta    = new Slotwire_Meta();
        $this->admin   = new Slotwire_Admin();

        $this->cors->init();
        $this->preview->init();
        $this->rest->init();
        $this->webhook->init();
        $this->meta->init();
        $this->admin->init();
    }
}
