<?php
/**
 * SlotWire CORS & Headless Routing
 *
 * Emits permissive CORS headers for Astro content loaders and optionally redirects
 * public WordPress visitors to the headless Astro frontend.
 *
 * @package SlotwireHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

class Slotwire_Cors {

    /**
     * Registers CORS and redirect filters.
     */
    public function init() {
        add_action('init', [$this, 'handle_preflight_options']);
        add_filter('rest_pre_serve_request', [$this, 'add_cors_headers'], 10, 4);
        add_action('template_redirect', [$this, 'maybe_redirect_frontend']);
    }

    /**
     * Responds to HTTP OPTIONS preflight requests for REST API.
     */
    public function handle_preflight_options() {
        if (isset($_SERVER['REQUEST_METHOD']) && strtoupper($_SERVER['REQUEST_METHOD']) === 'OPTIONS') {
            $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
            if (strpos($request_uri, '/wp-json') !== false) {
                $this->send_cors_headers();
                status_header(200);
                exit;
            }
        }
    }

    /**
     * Sends CORS headers on REST API responses.
     *
     * @param mixed            $value Response value.
     * @param WP_REST_Server   $server Server instance.
     * @param WP_REST_Request  $request Request object.
     * @return mixed Response value unchanged.
     */
    public function add_cors_headers($value, $result, $request, $server) {
        $this->send_cors_headers();
        return $value;
    }

    /**
     * Emits CORS HTTP headers.
     */
    public function send_cors_headers() {
        $origin = get_option('slotwire_cors_origins', '*');
        if (empty($origin)) {
            $origin = '*';
        }

        header("Access-Control-Allow-Origin: {$origin}");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, PATCH, DELETE");
        header("Access-Control-Allow-Headers: Authorization, Content-Type, X-SlotWire-Action, X-SlotWire-Signature, X-SlotWire-Secret, X-SlotWire-Token, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages");
    }

    /**
     * Redirects public WordPress frontend visitors to the headless Astro site.
     */
    public function maybe_redirect_frontend() {
        if (is_admin()) {
            return;
        }

        // Do not redirect REST API requests or login page
        if (defined('REST_REQUEST') && REST_REQUEST) {
            return;
        }
        $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        if (strpos($request_uri, '/wp-json') !== false || strpos($request_uri, '/wp-login.php') !== false) {
            return;
        }

        $redirect_enabled = get_option('slotwire_redirect_frontend', false);
        if (!$redirect_enabled) {
            return;
        }

        $frontend_url = get_option('slotwire_frontend_url', '');
        if (empty($frontend_url)) {
            return;
        }

        $target = rtrim($frontend_url, '/') . $request_uri;
        wp_redirect(esc_url_raw($target), 302);
        exit;
    }
}
