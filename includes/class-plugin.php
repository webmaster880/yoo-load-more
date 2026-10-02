<?php
/**
 * Main plugin orchestrator.
 *
 * @package YooLoadMore
 */

namespace YooLoadMore;

defined('ABSPATH') || exit;

final class Plugin
{
    /** @var self|null */
    private static $instance;

    public static function instance(): self
    {
        if (!self::$instance instanceof self) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct()
    {
        add_action('init', [$this, 'register_assets_and_block']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        add_action('after_setup_theme', [$this, 'load_yootheme_addon'], 20);
    }

    public function register_assets_and_block(): void
    {
        wp_register_script(
            'yoo-load-more-engine',
            YOO_LOAD_MORE_URL . 'assets/js/load-more-engine.js',
            [],
            YOO_LOAD_MORE_VERSION,
            true
        );

        wp_register_style(
            'yoo-load-more',
            YOO_LOAD_MORE_URL . 'assets/css/load-more.css',
            [],
            YOO_LOAD_MORE_VERSION
        );

        wp_register_script(
            'yoo-load-more-block-editor',
            YOO_LOAD_MORE_URL . 'assets/js/block-editor.js',
            ['wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n'],
            YOO_LOAD_MORE_VERSION,
            true
        );

        wp_set_script_translations('yoo-load-more-block-editor', 'yoo-load-more');

        if (function_exists('register_block_type')) {
            register_block_type(YOO_LOAD_MORE_PATH . 'blocks/load-more', [
                'render_callback' => [Block_Renderer::class, 'render'],
            ]);
        }
    }

    public function enqueue_frontend_assets(): void
    {
        wp_enqueue_script('yoo-load-more-engine');
        wp_enqueue_style('yoo-load-more');

        wp_localize_script('yoo-load-more-engine', 'YooLoadMoreSettings', [
            'errorText' => __('Unable to load more posts. Please try again.', 'yoo-load-more'),
        ]);
    }

    public function load_yootheme_addon(): void
    {
        if (!class_exists(\YOOtheme\Application::class, false)) {
            return;
        }

        $app = \YOOtheme\Application::getInstance();
        $app->load(YOO_LOAD_MORE_PATH . 'bootstrap.php');
    }
}

