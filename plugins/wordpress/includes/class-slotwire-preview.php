<?php
/**
 * SlotWire Live Preview Bridge
 *
 * Rewrites WordPress preview links to redirect to Astro staging with signed HMAC-SHA256 tokens.
 *
 * @package SlotwireHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

class Slotwire_Preview {

    /**
     * Registers WordPress filters for live preview links.
     */
    public function init() {
        add_filter('preview_post_link', [$this, 'filter_preview_link'], 10, 2);
        add_filter('get_sample_permalink_html', [$this, 'filter_sample_permalink_html'], 10, 5);
    }

    /**
     * URL-safe Base64 encoder (RFC 4648 § 5).
     *
     * @param string $data Binary or string data.
     * @return string URL-safe Base64 encoded string.
     */
    public static function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * URL-safe Base64 decoder.
     *
     * @param string $data URL-safe Base64 encoded string.
     * @return string|false Decoded data.
     */
    public static function base64url_decode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Generates an HMAC-SHA256 signed JWT token cryptographically compatible with @slotwire/core.
     *
     * @param int|WP_Post $post Post ID or WP_Post instance.
     * @param int         $ttl  Time-to-live in seconds (defaults to 3600 = 1 hour).
     * @return string|null Signed token string or null on failure.
     */
    public function generate_preview_token($post, $ttl = 3600) {
        if (is_numeric($post)) {
            $post = get_post($post);
        }
        if (!$post instanceof WP_Post) {
            return null;
        }

        $secret = get_option('slotwire_preview_secret', '');
        if (empty($secret)) {
            return null;
        }

        $now = time();
        $payload = [
            'sub'       => (string) $post->ID,
            'slug'      => $post->post_name,
            'post_type' => $post->post_type,
            'iat'       => $now,
            'exp'       => $now + $ttl,
        ];

        $header = ['alg' => 'HS256', 'typ' => 'JWT'];

        $header_b64  = self::base64url_encode(wp_json_encode($header));
        $payload_b64 = self::base64url_encode(wp_json_encode($payload));
        $data_to_sign = $header_b64 . '.' . $payload_b64;

        $raw_signature = hash_hmac('sha256', $data_to_sign, $secret, true);
        $signature_b64 = self::base64url_encode($raw_signature);

        return $data_to_sign . '.' . $signature_b64;
    }

    /**
     * Verifies an HMAC-SHA256 preview token.
     *
     * @param string $token Signed preview token.
     * @return array Verification result with ['valid' => bool, 'payload' => array|null, 'error' => string|null].
     */
    public function verify_preview_token($token) {
        if (empty($token) || !is_string($token)) {
            return ['valid' => false, 'error' => 'Empty or invalid token format', 'payload' => null];
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return ['valid' => false, 'error' => 'Malformed token structure', 'payload' => null];
        }

        list($header_b64, $payload_b64, $signature_b64) = $parts;
        $data_to_sign = $header_b64 . '.' . $payload_b64;

        $secret = get_option('slotwire_preview_secret', '');
        if (empty($secret)) {
            return ['valid' => false, 'error' => 'Preview secret not configured', 'payload' => null];
        }

        $raw_expected_sig = hash_hmac('sha256', $data_to_sign, $secret, true);
        $expected_sig_b64 = self::base64url_encode($raw_expected_sig);

        if (!hash_equals($expected_sig_b64, $signature_b64)) {
            return ['valid' => false, 'error' => 'Invalid HMAC signature', 'payload' => null];
        }

        $payload_json = self::base64url_decode($payload_b64);
        $payload = json_decode($payload_json, true);

        if (!$payload || !isset($payload['exp'])) {
            return ['valid' => false, 'error' => 'Invalid payload format', 'payload' => null];
        }

        if (time() > $payload['exp']) {
            return ['valid' => false, 'error' => 'Preview token expired', 'payload' => null];
        }

        return ['valid' => true, 'payload' => $payload, 'error' => null];
    }

    /**
     * Filters standard WordPress preview link to point to Astro staging with signed token.
     *
     * @param string  $link Original WordPress preview link.
     * @param WP_Post $post Current post object.
     * @return string Modified preview link.
     */
    public function filter_preview_link($link, $post) {
        $frontend_url = get_option('slotwire_frontend_url', '');
        if (empty($frontend_url) || !($post instanceof WP_Post)) {
            return $link;
        }

        $token = $this->generate_preview_token($post);
        if (!$token) {
            return $link;
        }

        $base = rtrim($frontend_url, '/');
        $path = $this->resolve_post_path($post);

        return add_query_arg([
            'slotwire_preview' => 'true',
            'token'            => $token,
        ], $base . $path);
    }

    /**
     * Enhances Classic Editor / Gutenberg permalink sample bar with "Preview in Astro" button.
     *
     * @param string $return Sample permalink HTML.
     * @param int    $post_id Post ID.
     * @return string Modified HTML.
     */
    public function filter_sample_permalink_html($return, $post_id, $new_title, $new_slug, $post) {
        $frontend_url = get_option('slotwire_frontend_url', '');
        if (empty($frontend_url) || !$post instanceof WP_Post) {
            return $return;
        }

        $preview_url = $this->filter_preview_link('', $post);
        if ($preview_url) {
            $btn = sprintf(
                '<a href="%s" target="_blank" rel="noopener noreferrer" class="button button-small" style="margin-left: 8px; border-color: #10b981; color: #047857;">⚡ Preview in Astro ↗</a>',
                esc_url($preview_url)
            );
            $return .= $btn;
        }

        return $return;
    }

    /**
     * Resolves the frontend URL route for a given post.
     *
     * @param WP_Post $post Post object.
     * @return string Route path.
     */
    public function resolve_post_path($post) {
        if ($post->post_type === 'page') {
            $uri = get_page_uri($post->ID);
            return '/' . ltrim($uri, '/');
        }

        $slug = !empty($post->post_name) ? $post->post_name : 'preview-' . $post->ID;

        if ($post->post_type === 'post') {
            return '/posts/' . $slug;
        }

        return '/' . $post->post_type . '/' . $slug;
    }
}
