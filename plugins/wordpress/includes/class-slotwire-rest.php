<?php
/**
 * SlotWire Clean REST API Endpoints
 *
 * Exposes /wp-json/slotwire/v1/* routes with flattened data models,
 * parsed Gutenberg block AST, ACF field inclusion, and preview token authentication.
 *
 * @package SlotwireHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

class Slotwire_Rest {

    const NAMESPACE = 'slotwire/v1';

    /**
     * Registers REST API routes.
     */
    public function init() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Registers the SlotWire REST endpoints.
     */
    public function register_routes() {
        // GET /wp-json/slotwire/v1/content/:post_type
        register_rest_route(self::NAMESPACE, '/content/(?P<post_type>[a-zA-Z0-9_-]+)', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_content'],
                'permission_callback' => '__return_true',
                'args'                => [
                    'post_type' => [
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_key',
                    ],
                    'slug' => [
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'id' => [
                        'type'              => 'integer',
                        'sanitize_callback' => 'absint',
                    ],
                    'slot' => [
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'status' => [
                        'type'              => 'string',
                        'default'           => 'publish',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'per_page' => [
                        'type'              => 'integer',
                        'default'           => 50,
                        'sanitize_callback' => 'absint',
                    ],
                    'page' => [
                        'type'              => 'integer',
                        'default'           => 1,
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
        ]);

        // POST /wp-json/slotwire/v1/content/:post_type/:id
        register_rest_route(self::NAMESPACE, '/content/(?P<post_type>[a-zA-Z0-9_-]+)/(?P<id>\d+)', [
            [
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => [$this, 'update_content'],
                'permission_callback' => [$this, 'check_update_permissions'],
                'args'                => [
                    'id' => [
                        'required'          => true,
                        'type'              => 'integer',
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
        ]);

        // GET /wp-json/slotwire/v1/meta/slots
        register_rest_route(self::NAMESPACE, '/meta/slots', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_slots_meta'],
                'permission_callback' => '__return_true',
            ],
        ]);
    }

    /**
     * Checks if request has permission to update content.
     * Accepts logged in WP user with edit_post capability OR valid SlotWire secret / token.
     */
    public function check_update_permissions(WP_REST_Request $request) {
        $post_id = $request->get_param('id');

        // Check 1: Logged in user with edit_post capability
        if (current_user_can('edit_post', $post_id)) {
            return true;
        }

        // Check 2: Shared secret via x-slotwire-secret or Authorization Bearer
        $configured_secret = get_option('slotwire_preview_secret', '');
        if (!empty($configured_secret)) {
            $secret_header = $request->get_header('x-slotwire-secret');
            if (!empty($secret_header) && hash_equals($configured_secret, $secret_header)) {
                return true;
            }

            $auth_header = $request->get_header('authorization');
            if (!empty($auth_header) && strpos($auth_header, 'Bearer ') === 0) {
                $bearer = trim(substr($auth_header, 7));
                if (hash_equals($configured_secret, $bearer)) {
                    return true;
                }
            }
        }

        return new WP_Error(
            'rest_forbidden',
            __('Sorry, you are not authorized to update this content.', 'slotwire-headless'),
            ['status' => 403]
        );
    }

    /**
     * Handles GET /wp-json/slotwire/v1/content/:post_type
     */
    public function get_content(WP_REST_Request $request) {
        $raw_post_type = $request->get_param('post_type');

        // Normalize plural to singular if needed (e.g. posts -> post, pages -> page)
        $post_type = $raw_post_type;
        if (!post_type_exists($post_type)) {
            if ($raw_post_type === 'posts') $post_type = 'post';
            elseif ($raw_post_type === 'pages') $post_type = 'page';
            elseif (post_type_exists(rtrim($raw_post_type, 's'))) {
                $post_type = rtrim($raw_post_type, 's');
            }
        }

        if (!post_type_exists($post_type)) {
            return new WP_Error(
                'rest_post_type_invalid',
                sprintf(__('Post type "%s" does not exist.', 'slotwire-headless'), $raw_post_type),
                ['status' => 404]
            );
        }

        $per_page = min(100, max(1, (int) $request->get_param('per_page')));
        $page     = max(1, (int) $request->get_param('page'));
        $slug     = $request->get_param('slug');
        $id       = $request->get_param('id');
        $slot     = $request->get_param('slot');
        $status   = $request->get_param('status') ?: 'publish';

        // Check if requester is authorized to view drafts or private items
        $can_view_drafts = current_user_can('edit_posts');
        if (!$can_view_drafts) {
            $token = $request->get_param('token') ?: $request->get_header('x-slotwire-token');
            if ($token) {
                $preview = new Slotwire_Preview();
                $res = $preview->verify_preview_token($token);
                if ($res['valid']) {
                    $can_view_drafts = true;
                }
            }
        }

        $query_args = [
            'post_type'              => $post_type,
            'posts_per_page'         => $per_page,
            'paged'                  => $page,
            'post_status'            => $can_view_drafts && $status !== 'publish' ? $status : 'publish',
            'orderby'                => 'date',
            'order'                  => 'DESC',
            'no_found_rows'          => false,
            'update_post_meta_cache' => true,
            'update_post_term_cache' => true,
        ];

        if (!empty($slug)) {
            if ($post_type === 'page') {
                $query_args['pagename'] = $slug;
            } else {
                $query_args['name'] = $slug;
            }
        }
        if (!empty($id)) {
            $query_args['p'] = $id;
        }
        if (!empty($slot)) {
            $query_args['meta_query'] = [
                [
                    'key'     => '_slotwire_slot',
                    'value'   => $slot,
                    'compare' => '=',
                ],
            ];
        }

        $query = new WP_Query($query_args);
        $posts = $query->posts;

        $results = [];
        foreach ($posts as $post) {
            $results[] = $this->format_post_item($post);
        }

        $response = rest_ensure_response($results);
        $response->header('X-WP-Total', (string) $query->found_posts);
        $response->header('X-WP-TotalPages', (string) $query->max_num_pages);

        return $response;
    }

    /**
     * Formats a WP_Post object into a clean, flattened SlotWire document payload.
     *
     * @param WP_Post $post WP_Post object.
     * @return array Normalized item payload.
     */
    public function format_post_item(WP_Post $post) {
        $rendered_content = apply_filters('the_content', $post->post_content);

        // Parse Gutenberg Blocks AST if blocks present
        $blocks = [];
        if (function_exists('has_blocks') && has_blocks($post->post_content)) {
            $blocks = parse_blocks($post->post_content);
        }

        // Resolve Featured Image / Media
        $featured_media = null;
        if (has_post_thumbnail($post->ID)) {
            $thumb_id = get_post_thumbnail_id($post->ID);
            $img_src  = wp_get_attachment_image_src($thumb_id, 'full');
            if ($img_src) {
                $featured_media = [
                    'id'     => (int) $thumb_id,
                    'url'    => $img_src[0],
                    'width'  => $img_src[1],
                    'height' => $img_src[2],
                    'alt'    => get_post_meta($thumb_id, '_wp_attachment_image_alt', true) ?: '',
                ];
            }
        }

        // Resolve Meta & ACF
        $all_meta = get_post_meta($post->ID);
        $clean_meta = [];
        foreach ($all_meta as $key => $values) {
            if (strpos($key, '_') === 0 && strpos($key, '_slotwire_') !== 0) {
                // Ignore internal WordPress underscore fields
                continue;
            }
            $clean_meta[$key] = count($values) === 1 ? maybe_unserialize($values[0]) : array_map('maybe_unserialize', $values);
        }

        $acf_fields = null;
        if (function_exists('get_fields')) {
            $acf_fields = get_fields($post->ID) ?: null;
        }

        $slot_assignment = get_post_meta($post->ID, '_slotwire_slot', true);

        return [
            'id'             => (int) $post->ID,
            'slug'           => $post->post_name,
            'title'          => html_entity_decode($post->post_title, ENT_QUOTES, 'UTF-8'),
            'status'         => $post->post_status,
            'date'           => get_the_date('c', $post),
            'modified'       => get_the_modified_date('c', $post),
            'author'         => get_the_author_meta('display_name', $post->post_author),
            'content'        => $rendered_content,
            'raw_content'    => $post->post_content,
            'excerpt'        => html_entity_decode(get_the_excerpt($post), ENT_QUOTES, 'UTF-8'),
            'featured_media' => $featured_media,
            'slot'           => $slot_assignment ?: null,
            'meta'           => !empty($clean_meta) ? $clean_meta : new stdClass(),
            'acf'            => $acf_fields,
            'blocks'         => !empty($blocks) ? $blocks : null,
        ];
    }

    /**
     * Handles POST /wp-json/slotwire/v1/content/:post_type/:id
     */
    public function update_content(WP_REST_Request $request) {
        $post_id = (int) $request->get_param('id');
        $post    = get_post($post_id);

        if (!$post) {
            return new WP_Error('rest_post_not_found', __('Post not found', 'slotwire-headless'), ['status' => 404]);
        }

        $body = $request->get_json_params() ?: [];

        $post_data = ['ID' => $post_id];

        if (isset($body['title'])) {
            $post_data['post_title'] = sanitize_text_field($body['title']);
        }
        if (isset($body['content'])) {
            $post_data['post_content'] = wp_kses_post($body['content']);
        }
        if (isset($body['excerpt'])) {
            $post_data['post_excerpt'] = sanitize_textarea_field($body['excerpt']);
        }
        if (isset($body['status'])) {
            $post_data['post_status'] = sanitize_text_field($body['status']);
        }

        $updated = wp_update_post($post_data, true);
        if (is_wp_error($updated)) {
            return $updated;
        }

        // Update custom fields if provided
        if (isset($body['meta']) && is_array($body['meta'])) {
            foreach ($body['meta'] as $m_key => $m_val) {
                update_post_meta($post_id, sanitize_key($m_key), $m_val);
            }
        }

        if (isset($body['slot'])) {
            update_post_meta($post_id, '_slotwire_slot', sanitize_text_field($body['slot']));
        }

        $refreshed_post = get_post($post_id);
        return rest_ensure_response($this->format_post_item($refreshed_post));
    }

    /**
     * Handles GET /wp-json/slotwire/v1/meta/slots
     */
    public function get_slots_meta(WP_REST_Request $request) {
        $public_types = get_post_types(['public' => true], 'objects');
        $types_data = [];

        foreach ($public_types as $slug => $type_obj) {
            if ($slug === 'attachment') continue;
            $types_data[] = [
                'slug'         => $slug,
                'label'        => $type_obj->labels->name,
                'hierarchical' => (bool) $type_obj->hierarchical,
                'has_archive'  => (bool) $type_obj->has_archive,
            ];
        }

        // Collect posts that have _slotwire_slot defined
        $assigned_slots = [];
        $slot_posts = get_posts([
            'post_type'   => 'any',
            'post_status' => 'any',
            'meta_key'    => '_slotwire_slot',
            'numberposts' => 100,
        ]);

        foreach ($slot_posts as $p) {
            $slot_name = get_post_meta($p->ID, '_slotwire_slot', true);
            if ($slot_name) {
                $assigned_slots[] = [
                    'slot'      => $slot_name,
                    'post_id'   => $p->ID,
                    'post_type' => $p->post_type,
                    'slug'      => $p->post_name,
                    'title'     => $p->post_title,
                ];
            }
        }

        return rest_ensure_response([
            'post_types'     => $types_data,
            'assigned_slots' => $assigned_slots,
            'version'        => SLOTWIRE_VERSION,
        ]);
    }
}
