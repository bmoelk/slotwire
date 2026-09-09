<?php
/**
 * SlotWire Meta & Editor Integration
 *
 * Registers _slotwire_slot post meta and adds sidebar panels to Gutenberg and Classic Editor.
 *
 * @package SlotwireHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

class Slotwire_Meta {

    /**
     * Registers meta and UI hooks.
     */
    public function init() {
        add_action('init', [$this, 'register_meta_fields']);
        add_action('add_meta_boxes', [$this, 'register_meta_boxes']);
        add_action('save_post', [$this, 'save_meta_box_data']);
    }

    /**
     * Registers _slotwire_slot post meta for all public post types.
     */
    public function register_meta_fields() {
        $post_types = get_post_types(['public' => true]);

        foreach ($post_types as $post_type) {
            register_post_meta($post_type, '_slotwire_slot', [
                'show_in_rest'      => true,
                'single'             => true,
                'type'               => 'string',
                'description'        => __('SlotWire Slot Designation (e.g. hero, announcements, team)', 'slotwire-headless'),
                'sanitize_callback'  => 'sanitize_text_field',
                'auth_callback'      => function() {
                    return current_user_can('edit_posts');
                },
            ]);
        }
    }

    /**
     * Registers Classic Editor / standard sidebar meta box.
     */
    public function register_meta_boxes() {
        $post_types = get_post_types(['public' => true]);

        foreach ($post_types as $post_type) {
            add_meta_box(
                'slotwire_meta_box',
                __('⚡ SlotWire Headless', 'slotwire-headless'),
                [$this, 'render_meta_box'],
                $post_type,
                'side',
                'default'
            );
        }
    }

    /**
     * Renders the SlotWire meta box in post edit sidebar.
     *
     * @param WP_Post $post Current post.
     */
    public function render_meta_box($post) {
        wp_nonce_field('slotwire_save_meta', 'slotwire_meta_nonce');

        $current_slot = get_post_meta($post->ID, '_slotwire_slot', true);
        $preview_instance = new Slotwire_Preview();
        $preview_url = $preview_instance->filter_preview_link('', $post);
        ?>
        <div class="slotwire-meta-box-content" style="font-size: 12px; line-height: 1.5;">
            <p style="margin-top: 0; color: #555;">
                <?php esc_html_e('Designate which SlotWire slot contract this document maps to in your Astro frontend.', 'slotwire-headless'); ?>
            </p>

            <div style="margin-bottom: 12px;">
                <label for="slotwire_slot_input" style="font-weight: 600; display: block; margin-bottom: 4px;">
                    <?php esc_html_e('Slot Key / Archetype:', 'slotwire-headless'); ?>
                </label>
                <input
                    type="text"
                    id="slotwire_slot_input"
                    name="slotwire_slot"
                    value="<?php echo esc_attr($current_slot); ?>"
                    placeholder="e.g. hero, projects, footer"
                    style="width: 100%; font-family: monospace; font-size: 12px;"
                />
                <small style="color: #666; display: block; margin-top: 3px;">
                    <?php esc_html_e('Matches slot key in defineContract({ slots: { ... } })', 'slotwire-headless'); ?>
                </small>
            </div>

            <?php if (!empty($preview_url)) : ?>
                <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
                    <a
                        href="<?php echo esc_url($preview_url); ?>"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="button button-secondary"
                        style="width: 100%; text-align: center; border-color: #10b981; color: #047857; font-weight: 600;"
                    >
                        ⚡ Live Astro Preview ↗
                    </a>
                </div>
            <?php else : ?>
                <p style="color: #999; font-style: italic; margin-bottom: 0;">
                    <?php esc_html_e('Configure Frontend URL in Settings > SlotWire Headless to enable live preview.', 'slotwire-headless'); ?>
                </p>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Saves meta box data when post is saved.
     *
     * @param int $post_id Post ID.
     */
    public function save_meta_box_data($post_id) {
        if (!isset($_POST['slotwire_meta_nonce']) || !wp_verify_nonce($_POST['slotwire_meta_nonce'], 'slotwire_save_meta')) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        if (isset($_POST['slotwire_slot'])) {
            $val = sanitize_text_field($_POST['slotwire_slot']);
            if (!empty($val)) {
                update_post_meta($post_id, '_slotwire_slot', $val);
            } else {
                delete_post_meta($post_id, '_slotwire_slot');
            }
        }
    }
}
