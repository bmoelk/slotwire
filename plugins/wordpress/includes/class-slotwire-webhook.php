<?php
/**
 * SlotWire On-Demand ISR Revalidation Webhooks
 *
 * Dispatches non-blocking HMAC-signed webhook payloads to Astro on post publish, update, and delete events.
 *
 * @package SlotwireHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

class Slotwire_Webhook {

    /**
     * Registers WordPress action hooks.
     */
    public function init() {
        add_action('transition_post_status', [$this, 'handle_status_transition'], 10, 3);
        add_action('deleted_post', [$this, 'handle_post_deleted'], 10, 2);
    }

    /**
     * Handles post status transition (publish, update, unpublish).
     *
     * @param string  $new_status New post status.
     * @param string  $old_status Old post status.
     * @param WP_Post $post Current post object.
     */
    public function handle_status_transition($new_status, $old_status, $post) {
        // Skip revisions, autosaves, and non-public post types
        if (wp_is_post_revision($post) || wp_is_post_autosave($post)) {
            return;
        }

        $post_type_obj = get_post_type_object($post->post_type);
        if (!$post_type_obj || !$post_type_obj->public) {
            return;
        }

        // Only fire if post was or is published
        if ($new_status !== 'publish' && $old_status !== 'publish') {
            return;
        }

        $event = 'post_updated';
        if ($old_status !== 'publish' && $new_status === 'publish') {
            $event = 'post_published';
        } elseif ($old_status === 'publish' && $new_status !== 'publish') {
            $event = 'post_unpublished';
        }

        $this->dispatch_webhook($event, $post, $new_status);
    }

    /**
     * Handles post deletion.
     *
     * @param int     $post_id Post ID.
     * @param WP_Post $post Current post object.
     */
    public function handle_post_deleted($post_id, $post) {
        if (!$post instanceof WP_Post || wp_is_post_revision($post)) {
            return;
        }

        $this->dispatch_webhook('post_deleted', $post, 'trash');
    }

    /**
     * Builds payload and dispatches non-blocking HTTP POST to Astro revalidation endpoint.
     *
     * @param string  $event Event name.
     * @param WP_Post $post Post object.
     * @param string  $status Current status.
     * @param bool    $blocking Whether the HTTP call should block execution (false for async publishing).
     * @return array|WP_Error|false Response or false if not dispatched.
     */
    public function dispatch_webhook($event, $post, $status = 'publish', $blocking = false) {
        $webhook_url = get_option('slotwire_webhook_url', '');
        if (empty($webhook_url)) {
            $frontend_url = get_option('slotwire_frontend_url', '');
            if (!empty($frontend_url)) {
                $webhook_url = rtrim($frontend_url, '/') . '/api/slotwire/revalidate';
            }
        }

        if (empty($webhook_url)) {
            return false;
        }

        $secret = get_option('slotwire_webhook_secret', '') ?: get_option('slotwire_preview_secret', '');
        if (empty($secret)) {
            return false;
        }

        $paths = [];
        if ($post->post_type === 'page') {
            $uri = get_page_uri($post->ID);
            $paths[] = '/' . ltrim($uri, '/');
        } else {
            $paths[] = '/' . $post->post_type . '/' . $post->post_name;
            if ($post->post_type === 'post') {
                $paths[] = '/posts/' . $post->post_name;
            }
        }
        $paths[] = '/';

        $payload = [
            'event'     => $event,
            'post_type' => $post->post_type,
            'id'        => (int) $post->ID,
            'slug'      => $post->post_name,
            'url'       => get_permalink($post->ID),
            'status'    => $status,
            'paths'     => array_values(array_unique($paths)),
            'timestamp' => time(),
        ];

        $body = wp_json_encode($payload);
        $signature = 'sha256=' . hash_hmac('sha256', $body, $secret);

        $args = [
            'method'      => 'POST',
            'timeout'     => $blocking ? 10 : 5,
            'redirection' => 2,
            'httpversion' => '1.1',
            'blocking'    => $blocking,
            'headers'     => [
                'Content-Type'         => 'application/json',
                'x-slotwire-signature' => $signature,
                'x-slotwire-secret'    => $secret,
                'User-Agent'           => 'SlotWire-WordPress/' . (defined('SLOTWIRE_VERSION') ? SLOTWIRE_VERSION : '0.2.0'),
            ],
            'body'        => $body,
        ];

        return wp_remote_post($webhook_url, $args);
    }

    /**
     * Dispatches a manual test ping to verify webhook connectivity.
     *
     * @return array Status report with success, status code, and message.
     */
    public function dispatch_test_ping() {
        $fake_post = (object) [
            'ID'        => 0,
            'post_type' => 'test',
            'post_name' => 'connection-test',
        ];

        $res = $this->dispatch_webhook('test_ping', $fake_post, 'publish', true);

        if (is_wp_error($res)) {
            return [
                'success' => false,
                'error'   => $res->get_error_message(),
            ];
        }

        $code = wp_remote_retrieve_response_code($res);
        $body = wp_remote_retrieve_body($res);

        return [
            'success' => $code >= 200 && $code < 300,
            'code'    => $code,
            'body'    => $body,
        ];
    }
}
