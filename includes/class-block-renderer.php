<?php
/**
 * Server-side renderer for the Gutenberg companion block.
 *
 * @package YooLoadMore
 */

namespace YooLoadMore;

defined('ABSPATH') || exit;

final class Block_Renderer
{
    /**
     * Render the dynamic Query Loop companion block.
     *
     * @param array<string, mixed> $attributes Block attributes.
     */
    public static function render(array $attributes): string
    {
        $attributes = wp_parse_args($attributes, [
            'mode' => 'button',
            'targetSelector' => '.wp-block-query .wp-block-post-template',
            'itemSelector' => ':scope > li',
            'paginationSelector' => '.wp-block-query-pagination',
            'nextSelector' => '.wp-block-query-pagination-next, a[rel="next"]',
            'defaultText' => __('Load more', 'yoo-load-more'),
            'loadingText' => __('Loading…', 'yoo-load-more'),
            'noMoreText' => __('No more posts', 'yoo-load-more'),
            'buttonStyle' => 'uk-button-default',
            'buttonSize' => '',
            'rootMargin' => '300px 0px',
            'debounce' => 200,
            'updateBrowserUrl' => false,
            'hidePagination' => true,
            'initialUrl' => '',
        ]);

        $mode = in_array($attributes['mode'], ['button', 'infinite', 'hybrid'], true)
            ? $attributes['mode']
            : 'button';
        $style = in_array(
            $attributes['buttonStyle'],
            ['uk-button-default', 'uk-button-primary', 'uk-button-secondary', 'uk-button-text'],
            true
        ) ? $attributes['buttonStyle'] : 'uk-button-default';
        $size = in_array($attributes['buttonSize'], ['', 'uk-button-small', 'uk-button-large'], true)
            ? $attributes['buttonSize']
            : '';

        $config = [
            'context' => 'wordpress-query',
            'mode' => $mode,
            'targetSelector' => (string) $attributes['targetSelector'],
            'itemSelector' => (string) $attributes['itemSelector'],
            'paginationSelector' => (string) $attributes['paginationSelector'],
            'nextSelector' => (string) $attributes['nextSelector'],
            'defaultText' => (string) $attributes['defaultText'],
            'loadingText' => (string) $attributes['loadingText'],
            'noMoreText' => (string) $attributes['noMoreText'],
            'rootMargin' => (string) $attributes['rootMargin'],
            'debounce' => max(0, min(2000, (int) $attributes['debounce'])),
            'updateBrowserUrl' => (bool) $attributes['updateBrowserUrl'],
            'hidePagination' => (bool) $attributes['hidePagination'],
            'initialUrl' => esc_url_raw((string) $attributes['initialUrl']),
        ];

        $wrapper_attributes = get_block_wrapper_attributes([
            'class' => 'yoo-load-more uk-text-center',
            'data-yoo-load-more' => '',
            'data-yoo-load-more-config' => wp_json_encode($config),
            'data-mode' => $mode,
        ]);
        $button_classes = trim('uk-button ' . $style . ' ' . $size);
        $default_text = esc_html((string) $attributes['defaultText']);
        $initial_url = esc_url((string) $attributes['initialUrl']);

        $html = '<div ' . $wrapper_attributes . '>';
        $html .= '<button type="button" class="' . esc_attr($button_classes) . '" data-yoo-load-more-button aria-controls="" aria-busy="false">';
        $html .= '<span data-yoo-load-more-spinner uk-spinner="ratio: 0.6" hidden></span>';
        $html .= '<span data-yoo-load-more-label>' . $default_text . '</span>';
        $html .= '</button>';
        $html .= '<span class="yoo-load-more__status" data-yoo-load-more-status role="status" aria-live="polite"></span>';
        $html .= '<span class="yoo-load-more__sentinel" data-yoo-load-more-sentinel aria-hidden="true"></span>';

        if ($initial_url) {
            $html .= '<noscript><p><a href="' . $initial_url . '">' . $default_text . '</a></p></noscript>';
        }

        $html .= '</div>';

        return $html;
    }
}

